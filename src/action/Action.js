/**
 * @copyright: Copyright (C) 2019
 * @desc: include some operation, for example play, seek , pause
 * @author: liuliguo
 * @file: Action.js
 */

import BaseClass from "../base/BaseClass";
import Events from "../config/EventsConfig";
export default class Action extends BaseClass {
  checkHanlder = null;
  resetStatus = { processor: false, audioPlayer: false };

  constructor(options) {
    super(options);
    this.player = options.player;
    if (!this.player) {
      return;
    }
    this.audioPlayer = options.audioPlayer;
    this.imagePlayer = options.imagePlayer;
    this.loadData = options.loadData;
    this.bindEvent();
  }
  bindEvent() {
    this.events.on(Events.ProcessorResetEnd, () => {
      this.checkResetReady("processor");
    });
    this.events.on(Events.AudioPlayerReady, () => {
      this.checkResetReady("audioPlayer");
    });
    this.events.on(Events.PlayerResetReady, () => {
      this.onResetReady();
    });
    this.events.on(Events.LoadDataSeek, (data, timer) => {
      this.onSeek(data, timer);
    });
    this.events.on(Events.ImagePlayerRenderEnd, (time, gap) => {
      this.onRenderEnd(time, gap);
    });
    this.events.on(Events.ImagePlayerWait, () => {
      this.audioPlayer.pause();
    });
  }
  play(currentTime) {
    this.logger.warn("play", "play start");
    this.sync(currentTime);
  }
  playerWait() {
    this.imagePlayer.pause();
    this.imagePlayer.status = "wait";
    this.imagePlayer.ready = false;
    this.events.emit(Events.ImagePlayerWait);
  }
  sync(time) {
    let player = this.player;
    if (player.reseting) return;

    let audioPlayer = this.audioPlayer;
    let imagePlayer = this.imagePlayer;
    let aOffset = audioPlayer.offset;
    let vOffset = imagePlayer.offset;
    let vEnd = imagePlayer.end;
    let minTime = Math.min(aOffset, vOffset);
    let maxTime = Math.max(aOffset, vOffset);
    if (!audioPlayer.need) {
      minTime = vOffset;
      maxTime = vOffset;
    } else if (
      audioPlayer.status === "waiting" ||
      imagePlayer.status === "wait"
    ) {
      return;
    }
    // console.log("sync", time, aOffset, vOffset, minTime, maxTime);
    let playbackRate = player.playbackRate;
    if (player.seeking) {
      player.seeking = false;
    }
    if (player.reseting) {
      return;
    }
    if (player.status === "pause") {
      return;
    }
    if (player.status === "end") {
      if (!audioPlayer.paused) {
        audioPlayer.pause();
      }
      return;
    }
    this.setCurrentTime(time);
    if (
      this.player.options.isLive &&
      ((!imagePlayer.imageData.pools[0].length &&
        time < this.player.duration * 1000) ||
        time > vEnd)
    ) {
      this.playerWait();
      setTimeout(() => {
        this.player.seek(time);
      }, 1000);
      return;
    }
    if (time < minTime) {
      this.sync(minTime);
      return;
    }
    //only play audio
    if (audioPlayer.need && time >= aOffset && time <= vOffset) {
      this.events.once(Events.AudioPlayerPlaySuccess, () => {
        imagePlayer.render(vOffset);
      });
      if (this.audioPlayer.status !== "playing" && this.audioPlayer.status !== "end") {
        audioPlayer.playbackRate = playbackRate;
        audioPlayer.play();
      }
      return;
    }
    //only play image
    if (time >= vOffset && (!audioPlayer.need || time <= aOffset)) {
      // console.log("play only image");
      imagePlayer.render(time);
      return;
    }
    //audio and image start play
    if (time > maxTime) {
      if (Math.abs(this.audioPlayer.currentTime - time) > 200) {
        this.audioPlayer.currentTime = time;
      }
      if (this.audioPlayer.status !== "playing" && this.audioPlayer.status !== "end") {
        this.audioPlayer.playbackRate = playbackRate;
        this.audioPlayer.play();
      }
      imagePlayer.render(time);
    }
  }
  setCurrentTime(time) {
    const currentTime = time;
    // console.log('setCurrentTime', time, this.player.startPts, currentTime);
    this.player.currentTime = currentTime;
    this.events.emit(Events.PlayerTimeUpdate, currentTime);
  }

  pause() {
    this.audioPlayer.pause();
    this.clearDrawHanlder();
  }
  seek(time) {
    // console.log('seek', time);
    let videoBuffered = this.imagePlayer.isBuffered(time);
    let audioBuffered = this.audioPlayer.isBuffered(time);
    this.player.pause();
    //video and audio have the same time period
    if (videoBuffered && audioBuffered) {
      this.logger.warn(
        "seek",
        `seek in buffer, time: ${time}, buffer: ${this.player.buffer()[0]}, ${
          this.player.buffer()[1]
        }`
      );
      if (this.audioPlayer.need) {
        this.audioPlayer.onSeekedHandler = () => {
          this.imagePlayer.render(time, false);
        };
        this.audioPlayer.currentTime = time;
      } else {
        this.imagePlayer.render(time, false);
      }
      this.events.emit(Events.StreamDataReady);
      setTimeout(() => {
        this.player.seeking = false;
      }, 100);
      // const currentPts = this.player.currentTime + this.player.startPts;
      // if (this.player.options.keepCache && Math.abs(currentPts - time) > 200) {
      if (this.player.options.keepCache) {
        this.player.processController.reset();
        // this.reset(time);
      }
    } else {
      this.logger.warn("Action seek reset");
      this.reset(time);
    }
  }
  reset(value, destroy = false) {
    this.logger.info("reset", "reset start");
    this.player.reseting = true;
    this.events.emit(Events.PlayerReset, value);
    this.resetStatus = { processor: false, audioPlayer: false };
    this.player.processController.reset();
    this.player.streamController.reset();
    this.player.audioPlayer.reset(value);
    this.player.imagePlayer.reset(value, destroy);
    this.player.currentIndex = null;
  }
  checkResetReady(type) {
    let resetStatus = this.resetStatus;
    if (type && typeof type === "string") {
      resetStatus[type] = true;
      let keys = Object.keys(resetStatus);
      for (let i = 0; i < keys.length; i++) {
        if (!resetStatus[keys[i]]) {
          return false;
        }
      }
      this.logger.warn("checkResetReady", "reset ready");
      this.events.emit(Events.PlayerResetReady);
    }
  }
  onResetReady() {
    this.player.reseting = false;
    this.logger.info("onResetReady", "reset Ready");
    if (this.player.changing) {
      this.events.emit(Events.DataProcessorReady);
    }
    if (this.player.seeking) {
      this.player.loadData.seekTime(this.player.currentTime / 1000);
    }
  }
  onSeek(data, timer) {
    let currentTime = this.player.currentTime;
    this.logger.info("onseek", currentTime, data, data.no, timer);
    if (
      data &&
      data.no &&
      Math.abs(currentTime - Math.floor(timer * 1000)) < 2
    ) {
      this.player.currentIndex = data.no;
      this.logger.info("seektime:", data.no, timer, this.player.currentTime);
      this.player.seekSegmentNo = data.no;
      this.player.streamController.startLoad(data.no);
    } else {
      this.logger.warn("seek failue, not found data", currentTime, data, timer);
    }
  }
  clearDrawHanlder() {
    clearTimeout(this.drawFrameHanlder);
    this.drawFrameHanlder = null;
  }
  onRenderEnd(time, gap) {
    if (this.player.seekTime) {
      this.logger.info(
        "onRenderEnd",
        "seektoRenderTime:",
        Date.now() - this.player.seekTime
      );
      this.player.seekTime = null;
    }
    let imagePlayer = this.imagePlayer;
    let audioPlayer = this.audioPlayer;
    let player = this.player;
    let playbackRate = player.playbackRate;
    let aCurrentTime = audioPlayer.currentTime;
    let vCurrentTime = imagePlayer.currentTime;
    let aOffset = audioPlayer.offset;
    let fragDuration = imagePlayer.fragDuration;
    let delay = aCurrentTime - vCurrentTime;
    let nextTime = 0;
    // console.log("onRenderEnd", time, gap, vCurrentTime, aOffset, fragDuration);
    //no audio
    if (!audioPlayer.need) {
      this.drawNext(time + gap, Math.ceil(gap / playbackRate));
      return;
    }
    //only play image
    if (vCurrentTime < aOffset) {
      this.drawNext(vCurrentTime + fragDuration * playbackRate, fragDuration);
      return;
    }
    if (delay > 0) {
      if (delay > fragDuration) {
        nextTime =
          vCurrentTime +
          Math.ceil(delay / fragDuration + playbackRate) * fragDuration;
        fragDuration = nextTime - aCurrentTime;
      } else {
        nextTime = vCurrentTime + fragDuration * playbackRate;
        fragDuration = fragDuration - delay;
      }
    } else {
      nextTime = vCurrentTime + fragDuration * playbackRate;
      fragDuration = fragDuration - delay;
    }
    this.drawNext(nextTime, fragDuration);
  }
  drawNext(time, spanTime) {
    if (this.drawFrameHanlder) {
      this.clearDrawHanlder();
    }
    if (this.player.options.isLive) {
      const lastSegment = this.player.loadData.segmentPool.getLast();
      const { start, duration } = lastSegment;
      const lastTime = (start - 15 * duration) * 1000;
      // console.log("drawNext seek", lastTime, time);
      if (lastTime > 0 && time < lastTime) {
        this.player.seek(start * 1000);
        return;
      }
    }
    this.drawFrameHanlder = setTimeout(() => {
      this.sync(time);
    }, spanTime);
  }
}
