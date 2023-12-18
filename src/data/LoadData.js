/**
 * @copyright: Copyright (C) 2019
 * @file LoadData
 * @desc
 * ts load and data format
 * @author Jarry
 */

import BaseClass from "../base/BaseClass";
import BufferModel from "../model/BufferModel";
import BufferPool from "./BufferPool";
import Events from "../config/EventsConfig";

class LoadData extends BaseClass {
  bufferPool = [
    /* new BufferModel */
  ];
  audioBufferPool = [
    /* new BufferModel */
  ];
  sourceData = {};
  options = {};
  segmentPool = [
    /* new SegmentModel */
  ];
  seperateAudio = false;
  audioSegmentPool = [
    /* new SegmentModel */
  ];
  segmentIdFetched= [];
  audioSegmentIdFetched= [];

  readBufferNo = null;
  startLoadTime = null;
  currentSeekTime = null;

  constructor(options = {}) {
    super();
    this.options = options;
    this.player = options.player;
    this.keepCache = options.player.options.keepCache;
    this.init();
  }

  init() {
    this.setBufferPool(new BufferPool());
    this.setAudioBufferPool(new BufferPool());

    this.events.on(Events.LoadDataReadBufferByNo, (no, callback) => {
      this.readBufferByNo(no, callback, true);
      if (this.seperateAudio) this.readAudioBufferByNo(no, callback, true);
    });
    this.events.on(Events.LoadDataReadBuffer, (time, callback) => {
      this.readBuffer(time, callback);
    });
    this.events.on(Events.LoaderLoaded, (data, segment, type, time) => {
      const sourceType = this.options.player.options.type;
      if (sourceType === "HLS") {
        const buffer = this.createBuffer(
          {
            arrayBuffer: Uint8Array.from(data.arrayBuffer)
          },
          segment
        );
        this.segmentLoaded(segment, buffer);
        if (type === "seek" && time === this.currentSeekTime) {
          this.events.emit(Events.LoadDataSeek, buffer, time);
          this.removeBufferByNo(buffer.no);
          return;
        }
        if (this.seperateAudio) {
          if (buffer.start === this.startLoadTime && segment.audioOnly) {
            this.events.emit(Events.LoadDataFirstLoaded, buffer, time);
          }
        }else {
          if (time === this.startLoadTime) {
            this.events.emit(Events.LoadDataFirstLoaded, buffer, time);
          }
        }
      } else if (sourceType === "MP4") {
        const duration = this.options.player.options.duration;
        const arrayBuffer = Uint8Array.from(data.arrayBuffer);
        const buffer = {
          start: 0,
          end: duration,
          no: 0,
          duration,
          blob: data.data,
          arrayBuffer
        };
        this.events.emit(Events.LoadDataRead, new BufferModel(buffer));
      }
    });
  }

  setOptions(options) {
    Object.assign(this.options, options);
  }

  startLoad(time = 0) {
    this.logger.info("startLoad", "begin to load ts data", "time:", time);
    if (isNaN(time)) {
      this.logger.error("seekTime", "seek", "time:", time);
      return;
    }
    this.startLoadTime = time;
    this.loadSegmentByTime(time, "start");
  }

  readBuffer(time, callback) {
    const segment = this.getSegmentByTime(time);
    if (segment) {
      this.readAudioBufferByNo(segment.no, callback);
      this.readBufferByNo(segment.no, callback);
    }
  }

  segmentLoaded(segment, buffer) {
    if (buffer) {
      if (segment.audioOnly) {
        this.addAudioBufferPool(buffer);
        this.readAudioBufferByNo(segment.no);
      }else {
        this.addBufferPool(buffer);
        if (segment.no === this.options.player.currentIndex) {
          this.readBufferByNo(segment.no);
        }
      }
    }

    const lastNo = this.segmentPool.getLast().no;
    // push no to loaded
    if (!segment.audioOnly) {
      this.segmentIdFetched.push(segment.no)
    }
    // If has audio segments, try reading audio segment first, then next video segment
    if (!segment.audioOnly && this.audioSegmentPool.length > 0) {
      for(let id of this.segmentIdFetched) {
        if(this.audioSegmentIdFetched.indexOf(id) === -1){
          this.loadAudioSegmentByNo(id);
        }
      }
    }else if (segment.no < lastNo && segment.no <= this.options.player.currentIndex + 2) {
      this.loadSegmentByNo(segment.no + 1);
    }
  }

  seekTime(time) {
    if (isNaN(time)) {
      this.logger.error("seekTime", "seek", "time:", time);
      return;
    }
    this.currentSeekTime = time;
    let buffer;
    const idx = this.bufferPool.indexOfByTime(time);
    if (idx > -1) {
      buffer = this.bufferPool[idx];
      this.events.emit(Events.LoadDataSeek, buffer, time);
    } else {
      this.removeBufferPool(this.bufferPool.length);
      this.loadSegmentByTime(time, "seek");
    }
  }

  loadSegmentByTime(time, type) {
    if (isNaN(time)) {
      return;
    }
    // console.log('segmentPool', this.segmentPool);
    const idx = this.segmentPool.indexOfByTime(time);
    if (idx >= 0) {
      const segment = this.segmentPool[idx];
      this.events.emit(Events.LoaderLoadFile, segment, type, time);
    } else {
      this.logger.error(
        "loadSegmentByTime",
        "time over",
        "time:",
        time,
        "type:",
        type
      );
    }
  }

  createBuffer(data, segment) {
    if (!data) {
      return;
    }
    const buffer = {
      start: segment.start,
      end: segment.end,
      no: segment.no,
      audioOnly: segment.audioOnly,
      duration: segment.end - segment.start,
      // blob: data.blob,
      arrayBuffer: data.arrayBuffer
    };
    return new BufferModel(buffer);
  }

  isValidSegmentNo(no) {
    return !isNaN(no) && no > 0 && no <= this.segmentPool.length;
  }

  loadSegmentByNo(no) {
    const idx = no - 1;
    const segment = this.segmentPool.get(idx);
    if (!segment) {
      return;
    }
    const buffer = this.bufferPool.getByKeyValue("no", no)[0];
    if (!buffer) {
      // console.log("loadSegmentByNo", no);
      this.events.emit(Events.LoaderLoadFile, segment, "play");
    }
  }

  loadAudioSegmentByNo(no) {
    const idx = no - 1;
    const segment = this.audioSegmentPool.get(idx);
    if (!segment) {
      return;
    }
    this.audioSegmentIdFetched.push(no)
    const buffer = this.audioBufferPool.getByKeyValue("no", no)[0];
    if (!buffer) {
      // console.log("loadSegmentByNo", no);
      this.events.emit(Events.LoaderLoadFile, segment, "play");
    }
  }

  /**
   * get buffer from bufferPool and the blob will convert to arrayBuffer
   * @param {number} time
   * @param {Function} callback [optional]
   */
  readBufferByNo(no, callback, fromStream) {
    if (!this.isValidSegmentNo(no)) {
      this.logger.error(
        "readBufferByNo",
        "check buffer no",
        "is not valid no",
        no
      );
      return;
    }
    this.readBufferNo = no;
    callback =
      callback ||
      function (buffer) {
        this.events.emit(Events.LoadDataRead, buffer);
      };
    // console.log("readBufferByNo", no);
    this.getBlobByNo(no, callback, fromStream);
  }

  /**
   * get buffer from bufferPool and the blob will convert to arrayBuffer
   * @param {number} time
   * @param {Function} callback [optional]
   */
  readAudioBufferByNo(no, callback, fromStream) {
    if (!this.isValidSegmentNo(no)) {
      this.logger.error(
          "readAudioBufferByNo",
          "check buffer no",
          "is not valid no",
          no
      );
      return;
    }
    this.readBufferNo = no;
    callback =
        callback ||
        function (buffer) {
          this.events.emit(Events.LoadDataRead, buffer);
        };
    // console.log("readBufferByNo", no);
    this.getAudioBlobByNo(no, callback, fromStream);
  }

  /**
   * get segment from segment by time
   * @param {number} time
   */
  getSegmentByTime(time) {
    const idx = this.segmentPool.indexOfByTime(time);
    const segment = this.segmentPool[idx];
    return segment;
  }

  getBlobByNo(no, callback, fromStream) {
    if (isNaN(no)) {
      this.logger.error("getBlobByNo", "isNaN", "no:", no);
      return;
    }
    if (!this.keepCache && this.isBufferReading) {
      this.logger.warn("getBlobByNo", "isBufferReading", "no:", no);
      return;
    }
    let buffer;
    this.isBufferReading = true;
    buffer = this.bufferPool.getByKeyValue("no", no)[0];

    if (typeof callback == "function") {
      if (buffer) {
        callback.call(this, buffer);
        if (buffer.no <= this.options.player.currentIndex) {
          this.removeBufferByNo(buffer.no);
        }
      }else{
        this.logger.error("getBlobByNo", "buffer null", "no:", no);
        if (fromStream) {
          // this.player.streamController.currentIndex = no - 1;
          // this.loadSegmentByNo(no);
        }
      }
    }
    this.isBufferReading = false;
    return buffer;
  }
  getAudioBlobByNo(no, callback, fromStream) {
    if (isNaN(no)) {
      this.logger.error("getBlobByNo", "isNaN", "no:", no);
      return;
    }
    if (!this.keepCache && this.isBufferReading) {
      this.logger.warn("getBlobByNo", "isBufferReading", "no:", no);
      return;
    }
    let audioBuffer;
    this.isBufferReading = true;
    audioBuffer = this.audioBufferPool.getByKeyValue("no", no)[0];

    if (typeof callback == "function") {
      if (audioBuffer) {
        callback.call(this, audioBuffer);
        if (audioBuffer.no <= this.options.player.currentIndex) {
          this.removeAudioBufferByNo(audioBuffer.no);
        }
      }else{
        this.logger.error("getBlobByNo", "buffer null", "no:", no);
        if (fromStream) {
          // this.player.streamController.currentIndex = no - 1;
          this.loadAudioSegmentByNo(no);
        }
      }
    }
    this.isBufferReading = false;
    return audioBuffer;
  }

  addAudioBufferPool(buffer) {
    // console.log("addBufferPool", buffer.no);
    if (this.audioBufferPool.length) {
      if (this.audioBufferPool[0].no === buffer.no + 1) {
        this.audioBufferPool.unshift(buffer);
        return true;
      }
      const last = this.audioBufferPool.getLast();
      if (buffer.no - last.no === 1) {
        this.audioBufferPool.push(buffer);
        return true;
      }
      if (this.audioBufferPool.indexOfByKey("no", buffer.no) > -1) {
        return true;
      }
      this.audioBufferPool.splice(0, this.audioBufferPool.length);
    }
    this.audioBufferPool.push(buffer);
  }
  addBufferPool(buffer) {
    // console.log("addBufferPool", buffer.no);
    if (this.bufferPool.length) {
      if (this.bufferPool[0].no === buffer.no + 1) {
        this.bufferPool.unshift(buffer);
        return true;
      }
      const last = this.bufferPool.getLast();
      if (buffer.no - last.no === 1) {
        this.bufferPool.push(buffer);
        return true;
      }
      if (this.bufferPool.indexOfByKey("no", buffer.no) > -1) {
        return true;
      }
      this.bufferPool.splice(0, this.bufferPool.length);
    }
    this.bufferPool.push(buffer);
  }

  removeBufferPool(idx) {
    // let buffer = this.bufferPool.get(idx)
    // remove all segment before the time
    if (!this.keepCache) {
      this.bufferPool.splice(0, idx + 1);
    }
  }
  removeAudioBufferPool(idx) {
    // let buffer = this.bufferPool.get(idx)
    // remove all segment before the time
    if (!this.keepCache) {
      this.audioBufferPool.splice(0, idx + 1);
    }
  }
  removeBufferByNo(no) {
    // console.log("removeBufferPool", no);
    const idx = this.bufferPool.indexOfByKey("no", no);
    if (idx <= -1) {
      return;
    }
    this.removeBufferPool(idx);
    const segment = this.getSegmentByNo(no);
    segment.loaded = false;

    if (this.bufferPool.length) {
      // while buffer pool is full to read, load next one after last
      if (this.bufferPool.getLast().no < this.segmentPool.getLast().no) {
        this.loadSegmentByNo(this.bufferPool.getLast().no + 1);
      }
    } else if (no < this.segmentPool.getLast().no) {
      this.loadSegmentByNo(no + 1);
    }
    return true;
  }
  removeAudioBufferByNo(no) {
    // console.log("removeBufferPool", no);
    const idx = this.audioBufferPool.indexOfByKey("no", no);
    if (idx <= -1) {
      return;
    }
    this.removeAudioBufferPool(idx);
    const segment = this.getAudioSegmentByNo(no);
    segment.loaded = false;

    if (this.audioBufferPool.length) {
      // while buffer pool is full to read, load next one after last
      if (this.audioBufferPool.getLast().no < this.audioSegmentPool.getLast().no) {
        this.loadAudioSegmentByNo(this.audioBufferPool.getLast().no + 1);
      }
    } else if (no < this.audioSegmentPool.getLast().no) {
      this.loadAudioSegmentByNo(no + 1);
    }
    return true;
  }

  clear() {
    this.sourceData = {};
    this.readBufferNo = null;
    this.currentSeekTime = null;
    this.bufferPool.length = 0
    this.audioBufferPool.length = 0;
    this.segmentPool.length = 0;
    this.audioSegmentPool.length = 0;
  }

  getSegmentByNo(no) {
    // segmentPool is readonly data
    return this.segmentPool.get(no - 1);
  }

  getAudioSegmentByNo(no) {
    // segmentPool is readonly data
    return this.audioSegmentPool.get(no - 1);
  }

  getSegment(time) {
    return this.segmentPool.getByTime(time);
  }

  setSourceData(sourceData) {
    this.sourceData = sourceData;
  }

  getSourceData() {
    return this.sourceData;
  }

  setBufferPool(bufferPool) {
    this.bufferPool = bufferPool;
  }
  setAudioBufferPool(bufferPool) {
    this.audioBufferPool = bufferPool;
  }
  getBufferPool() {
    return this.bufferPool;
  }

  setSegmentPool(segmentPool) {
    this.segmentPool = segmentPool;
  }

  setAudioSegmentPool(audioSegmentPool) {
    if (audioSegmentPool.length > 0) {
      this.seperateAudio = true
    }
    this.audioSegmentPool = audioSegmentPool;
  }

  getSegmentPool() {
    return this.segmentPool;
  }
}

export default LoadData;
