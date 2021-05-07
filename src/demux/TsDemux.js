/**
 * @copyright: Copyright (C) 2019
 * @desc: ts packet demux
 * @author: liuliguo
 * @file: TsDemux.js
 */

import { TSDemux, Events as DemuxerEvents } from "demuxer";

import { AV_TIME_BASE_Q } from "../config/Config.js";
class TsDemux {
  previousPes = null;
  maxAudioPTS = 0;
  maxVideoPTS = 0;
  error = false;
  constructor(decode) {
    if (!decode) {
      console.error("class TsDemux need pass decode parmas");
      return;
    }
    this.init();
    this.dataArray = [];
    this.videoArray = [];
    this.audioArray = [];
    this.decode = decode;
  }
  init() {
    try {
      this.demuxer = new TSDemux({
        enableWorker: false,
        debug: false,
        onlyDemuxElementary: true
      });

      this.demuxer.on(DemuxerEvents.DEMUX_DATA, (event) => {
        if (this.error) return;

        if (event instanceof Array) {
          this.dataArray.push(event);
          this.demuxed(this.dataArray);
          this.dataArray = [];
        } else {
          this.dataArray.push(event);
        }
      });

      this.demuxer.on(DemuxerEvents.DONE, (event) => {
        if (this.error) return;

        let pes = {};
        this.demuxed(this.dataArray);
        this.dataArray = [];
        //one ts demux finished
        if (this.previousPes) {
          this.previousPes.partEnd = true;
          //the last ts packet demux finished
          this.previousPes.lastTS = this.isLast;
        }

        if (this.isLast) {
          this.maxPTS = Math.min(this.maxAudioPTS, this.maxVideoPTS);
          //the audio has finished
          pes.audioEnd = true;
          this.audioQueue(pes);
          self.postMessage({
            type: "demuxedAAC",
            data: this.audioArray,
            no: this.no
          });
          this.audioArray = [];
          self.postMessage({
            type: "maxPTS",
            data: {
              maxAudioPTS: this.maxAudioPTS,
              maxVideoPTS: this.maxVideoPTS
            }
          });
        } else {
          self.postMessage({
            type: "demuxedAAC",
            data: this.audioArray,
            no: this.no
          });
          this.audioArray = [];
        }
        //start decode H265
        if (!this.decoded) {
          this.decode.no = this.no;
          this.decode.poolIndex = this.poolIndex;
          this.decode.push(this.videoArray);
          this.videoArray = [];
          this.previousPes = null;
        }
      });
    } catch (error) {
      console.error("init demuxer failed.");
    }
  }
  push(data) {
    this.demuxer.push(data, { done: true });
  }
  demuxed(dataArray) {
    dataArray.forEach((data) => {
      this.tsDemuxed(data);
    });
  }
  tsDemuxed(data) {
    let streamType = data.stream_type;
    let pes = data.pes || {};
    // console.log('tsDemuxed', data);
    // console.log("tsDemuxed", this.decode.codec, streamType);
    if (
      (streamType === 27 && this.decode.codec === 1) ||
      (streamType === 36 && this.decode.codec === 0)
    ) {
      if (!this.error) {
        this.error = true;
        this.decode.onCodecError();
      }
      return;
    }
    switch (streamType) {
      //h264 h265
      case 27:
      case 36:
        this.videoQueue(pes);
        break;
      case 3:
      case 15:
      case 17:
        pes.PTS = Math.round(pes.PTS * AV_TIME_BASE_Q * 1000);
        this.maxAudioPTS = Math.max(pes.PTS, this.maxAudioPTS);
        this.audioQueue(pes);
        break;
      default:
        break;
    }
  }
  audioQueue(pes) {
    this.audioArray.push(pes);
  }
  videoQueue(pes) {
    this.previousPes = pes;
    this.maxVideoPTS = Math.max(this.maxVideoPTS, pes.PTS);
    this.videoArray.push(pes);
  }
  destroy() {
    this.demuxer.destroy();
  }
}
export default TsDemux;
