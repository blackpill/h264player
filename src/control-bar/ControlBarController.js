/**
 * @copyright: Copyright (C) 2019
 * @file ControlBar.js
 * @desc
 * the player pannel and control's facade
 * @see
 * @author Jarry
 */

import delegator from '../toolkit/Delegator.js';
import BaseController from '../base/BaseController.js';
import {CSSConfig} from '../config/CSSConfig';
import Events from '../config/EventsConfig';

const cssName = CSSConfig;

class ControlBarController extends BaseController {
  player = null;
  loadData = null;

  options = {
    cssName: cssName,
  };

  constructor(options = {}) {
    super(options);
    this.options = Object.assign(this.options, options);
    this.player = this.options.player;
    this.loadData = this.player.loadData;
    this.componentsController = this.player.componentsController;
    this.$screenContainer = this.player.$screenContainer;
    this.initComponents();
  }

  initComponents() {
    const componentsController = this.componentsController;
    if (this.options.controlBar) {
      Object.assign(this, componentsController.getAllComponents());
    } else {
      Object.assign(this, {
        BaseComponent: componentsController.getComponent('BaseComponent'),
        waitingBar: componentsController.getComponent('waitingBar'),
      });
    }
    this.container = this.controlBarContainer;
  }

  run() {
    this.drawLayout();
    this.bindEvent();
    if (!this.player.autoPlay) {
      this.events.emit(Events.ControlBarPause);
    } else {
      this.events.emit(Events.ControlBarPlay);
    }
  }

  bindEvent() {
    this.bindWaitingBarEvent();
    if (!this.options.controlBar) return;

    this.timer.setTotalTime(this.loadData);
    this.bindSpeedEvent();
    this.bindContainerEvent();
    this.bindTimerEvent();
    this.bindPlayEvent();
    this.bindProgressEvent();
    this.bindRateEvent();
    this.bindVolumeEvent();
    this.bindFullPage();
    this.bindFullScreen();
  }

  bindContainerEvent() {
    this.container.initProps();
    this.container.bindEvent();
  }

  bindTimerEvent() {
    this.timer.initProps();
    this.timer.bindEvent();
  }

  bindSpeedEvent() {
    this.speedBar.bindEvent();
    this.speedBar.resetBoxPosition();
  }

  bindRateEvent() {
    this.rateBar.bindEvent();
    this.rateBar.resetBoxPosition();
  }

  bindFullPage() {
    this.fullPage.initProps();
    this.fullPage.bindEvent();
  }

  bindFullScreen() {
    this.fullScreen.initProps();
    this.fullScreen.bindEvent();
  }

  bindWaitingBarEvent() {
    const eventsArr = [
      Events.PlayerWait,
      Events.PlayerSeeking,
      Events.PlayerReset,
      Events.PlayerChangeRate,
      Events.PlayerChangeSrc,
    ];
    eventsArr.forEach(item => {
      this.events.on(item, () => {
        this.waitingBar.showWaiting();
      });
    });
    this.events.on(Events.PlayerSeekEnd, () => {
      this.waitingBar.hideWaiting();
    });
    this.events.on(Events.PlayerPlay, () => {
      this.waitingBar.hideWaiting();
    });
    this.events.on(Events.PlayerPlaying, () => {
      this.waitingBar.hideWaiting();
    });
  }

  bindPlayEvent() {
    this.events.on(Events.ControlBarPlay, () => {
      if (this.pauseButton.data.status !== 'pause') {
        this.pauseButton.data.status = 'pause';
      }
      this.replayButton.hide();
      this.playButton.hide();
      this.pauseButton.show();
      this.bigPlayButton.hide();
    });
    this.events.on(Events.ControlBarPause, () => {
      if (this.player.status !== 'pause') {
        this.pauseButton.data.status = 'pause';
      }
      this.playButton.show();
      this.pauseButton.hide();
    });
    this.events.on(Events.PlayerEnd, () => {
      this.replayButton.show();
      this.pauseButton.hide();
      this.playButton.hide();
    });
    this.events.on(Events.PlayerPlay, () => {
      this.events.emit(Events.ControlBarPlay, this);
    });
    this.events.on(Events.PlayerPause, () => {
      this.events.emit(Events.ControlBarPause, this);
    });
    this.events.on(Events.PlayerOnSeek, time => {
      let duration = this.loadData.sourceData.duration;
      if (time < duration * 1000) {
        this.events.emit(Events.ControlBarPauseLoading);
      }
    });
    this.events.on(Events.ControlBarPauseLoading, () => {
      if (this.pauseButton.data.status !== 'pauseloading') {
        this.pauseButton.data.status = 'pauseloading';
      }
      this.replayButton.hide();
      this.playButton.hide();
      this.pauseButton.show();
    });

    delegator(this.options.$container).on(
      'click',
      '.' + cssName.playButton,
      () => {
        if (this.player.status !== 'play') {
          this.events.emit(Events.PlayerOnPlay, this);
        }
      },
    );
    delegator(this.options.$container).on(
      'click',
      '.' + cssName.pauseButton,
      () => {
        if (this.player.status !== 'pause') {
          this.events.emit(Events.PlayerOnPause, this);
        }
      },
    );
    delegator(this.options.$container).on(
      'click',
      '.' + cssName.replayButton,
      () => {
        this.events.emit(Events.PlayerOnSeek, this.player.startTime);
      },
    );
  }

  bindProgressEvent() {
    this.progressBar.initProps();
    this.progressBar.bindEvent();
  }

  bindVolumeEvent() {
    this.volumeBar.initProps();
    this.volumeBar.initVolumeSize();
    this.volumeBar.bindEvent();
  }

  drawLayout() {
    const $container = this.options.$container;
    if (this.container) {
      const $box = this.container.element;
      $container.append($box);
    }
  }

  destroy() {
    this.removeEventListenerGlobal();
    this.container && this.container.destroy();
  }

  removeEventListenerGlobal() {
    if (this.progressBar && this.progressBar.progressDragEvent) {
      this.progressBar.progressDragEvent.removeEventListenerAll();
    }
    if (this.volumeBar && this.volumeBar.volumeDragEvent) {
      this.volumeBar.volumeDragEvent.removeEventListenerAll();
    }
    this.fullPage && this.fullPage.removeEventListenerAll();
    this.fullScreen && this.fullScreen.removeEventListenerAll();
  }
}

export default ControlBarController;
