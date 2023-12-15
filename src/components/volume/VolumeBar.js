/**
 * @copyright: Copyright (C) 2019
 * @file VolumeBar.js
 * @desc
 * VolumeBar
 * @see
 * @author Jarry
 */

import delegator from "../../toolkit/Delegator.js";
import dragger from "../../toolkit/Dragger.js";
import BaseComponent from "../../base/BaseComponent";
import Events from "../../config/EventsConfig";
import { Config } from "../../config/Config";
import Template from "../../toolkit/Template";

// const AUDIO_ON_ICON = Template.create`
// <svg xmlns="http://www.w3.org/2000/svg" style="display:${"audioOnHide"}" width="40px" height="40px" viewBox="0 0 48 48" style="margin-left: -5px;">
// <path d="M5.2 7.68l6.175-5.293a.5.5 0 0 1 .825.38v17.825a.5.5 0 0 1-.825.38L5.2 15.679H3a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h2.2zm9 13.35v-2.375l.007-.003C16.852 17.493 19 14.897 19 11.479s-2.148-6.014-4.793-7.173a4.11 4.11 0 0 0-.007-.003V2c.027.006.054.012.082.02.852.221 1.274.453 1.436.535A10 10 0 0 1 21.2 11.48c0 4.106-2.474 7.633-6.013 9.174-.526.229-.583.284-.987.377zm0-13.973c1.5.925 2.5 2.582 2.5 4.473 0 1.892-1 3.55-2.5 4.473V7.057z" fill="#f1f1f1"></path>
// </svg>
// `;
// const AUDIO_OFF_ICON = Template.create`
// <svg xmlns="http://www.w3.org/2000/svg" style="display:${"audioOffHide"}" width="40px" height="40px" viewBox="0 0 48 48" style="margin-left: -5px;">
// <path d="M12.2 13.914v6.678a.5.5 0 0 1-.825.38L5.2 15.679H3a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h2.2l.412-.353-2.558-2.558a.5.5 0 0 1 0-.707l.707-.707a.5.5 0 0 1 .707 0l16.849 16.849a.5.5 0 0 1 0 .707l-.707.707a.5.5 0 0 1-.707 0l-2.386-2.386a10 10 0 0 1-2.33 1.422c-.526.229-.583.284-.987.377v-2.375l.007-.003a8.332 8.332 0 0 0 1.717-1.014l-1.67-1.669a5.251 5.251 0 0 1-.054.034v-.089l-2-2zM8.373 4.96l3.002-2.572a.5.5 0 0 1 .825.38v6.019L8.373 4.959zm9.867 9.867c.48-.99.76-2.115.76-3.347 0-3.418-2.148-6.014-4.793-7.173a4.11 4.11 0 0 0-.007-.003V2c.027.006.054.012.082.02.852.221 1.274.453 1.436.535A10 10 0 0 1 21.2 11.48a9.954 9.954 0 0 1-1.326 4.98l-1.634-1.633zm-1.766-1.766L14.2 10.786V7.057a5.247 5.247 0 0 1 2.274 6.003z" fill="#f1f1f1"></path>
// </svg>
// `;
const AUDIO_ON_ICON = Template.create`
<svg xmlns="http://www.w3.org/2000/svg" style="display:${"audioOnHide"}" width="40px" height="40px" viewBox="0 0 24 24" style="margin-left: -5px;">
<g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g clip-path="url(#clip0_525_159)"> <path d="M13.5 3.30132C13.5 1.55256 11.4138 0.646005 10.1354 1.83922L4.60584 7.00011H1C0.447715 7.00011 0 7.44783 0 8.00011V16.0001C0 16.5524 0.447715 17.0001 1 17.0001H4.60584L10.1354 22.161C11.4138 23.3542 13.5 22.4477 13.5 20.6989V3.30132Z" fill="#ffffff"></path> <path d="M15.1164 17.7028C14.8417 17.2237 15.0075 16.6126 15.4866 16.3379C16.2492 15.9008 16.8831 15.2703 17.3243 14.5101C17.7656 13.7499 17.9986 12.8868 18 12.0078C18.0013 11.1288 17.771 10.265 17.3321 9.50346C16.8931 8.74189 16.2612 8.10948 15.5 7.66998C15.0217 7.39384 14.8578 6.78225 15.134 6.30396C15.4101 5.82567 16.0217 5.66179 16.5 5.93793C17.5657 6.55323 18.4504 7.4386 19.0649 8.50479C19.6793 9.57099 20.0019 10.7803 20 12.0109C19.9981 13.2415 19.6718 14.4498 19.0541 15.5141C18.4363 16.5784 17.5489 17.4611 16.4813 18.0731C16.0021 18.3477 15.391 18.182 15.1164 17.7028Z" fill="#ffffff"></path> <path d="M17.4759 19.8082C16.9968 20.0828 16.831 20.6939 17.1057 21.1731C17.3803 21.6522 17.9914 21.818 18.4706 21.5433C20.1482 20.5816 21.5428 19.1946 22.5135 17.5221C23.4843 15.8497 23.997 13.9509 24 12.0171C24.003 10.0833 23.4961 8.1829 22.5305 6.50745C21.5649 4.832 20.1747 3.44071 18.5 2.47382C18.0217 2.19767 17.4101 2.36155 17.134 2.83984C16.8578 3.31813 17.0217 3.92972 17.5 4.20587C18.8702 4.99696 20.0077 6.13529 20.7977 7.50611C21.5877 8.87694 22.0024 10.4318 22 12.014C21.9976 13.5962 21.5781 15.1498 20.7838 16.5181C19.9895 17.8865 18.8486 19.0213 17.4759 19.8082Z" fill="#ffffff"></path> </g> <defs> <clipPath id="clip0_525_159"> <rect width="24" height="24" fill="white"></rect> </clipPath> </defs> </g>
</svg>
`;
const AUDIO_OFF_ICON = Template.create`
<svg xmlns="http://www.w3.org/2000/svg" style="display:${"audioOffHide"}" width="40px" height="40px" viewBox="0 0 24 24" style="margin-left: -5px;">
<g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M1.29292 20.2929C0.902398 20.6834 0.902398 21.3166 1.29292 21.7071C1.68345 22.0976 2.31661 22.0976 2.70714 21.7071L3.69966 20.7146C3.70215 20.7121 3.70463 20.7097 3.70711 20.7072L21.7071 2.70721C21.7096 2.70475 21.712 2.70227 21.7145 2.69979L22.7071 1.70711C23.0977 1.31658 23.0977 0.68342 22.7071 0.29289C22.3166 -0.097631 21.6834 -0.097631 21.2929 0.29289L13.5 8.08581V2.30132C13.5 0.55256 11.4138 -0.353996 10.1354 0.83921L4.60584 6.00011H1C0.447715 6.00011 0 6.44783 0 7.00011V15.0001C0 15.5524 0.447715 16.0001 1 16.0001H4.60584L5.11266 16.4732L1.29292 20.2929z" fill="#ffffff"></path><path d="M8.02396 19.1904L13.5 13.7143V19.6989C13.5 21.4477 11.4138 22.3542 10.1354 21.161L8.02396 19.1904z" fill="#ffffff"></path><path d="M17.7563 9.4581L19.2887 7.92564C19.7574 8.88434 20.0016 9.9396 20 11.0109C19.9981 12.2415 19.6718 13.4498 19.0541 14.5141C18.4363 15.5784 17.5489 16.4611 16.4813 17.0731C16.0021 17.3477 15.391 17.182 15.1164 16.7028C14.8417 16.2237 15.0075 15.6126 15.4866 15.3379C16.2492 14.9008 16.8831 14.2703 17.3243 13.5101C17.7656 12.7499 17.9986 11.8868 18 11.0078C18.0008 10.4795 17.9179 9.9566 17.7563 9.4581z" fill="#ffffff"></path><path d="M20.7648 6.44952L20.7977 6.50611C21.5877 7.87694 22.0024 9.4318 22 11.014C21.9975 12.5962 21.578 14.1498 20.7838 15.5181C19.9895 16.8865 18.8485 18.0213 17.4759 18.8082C16.9968 19.0828 16.831 19.6939 17.1057 20.1731C17.3803 20.6522 17.9914 20.818 18.4705 20.5433C20.1482 19.5816 21.5427 18.1946 22.5135 16.5221C23.4843 14.8497 23.997 12.9509 24 11.0171C24.003 9.0833 23.4961 7.1829 22.5305 5.50745C22.4306 5.33417 22.3262 5.16393 22.2174 4.99688L20.7648 6.44952z" fill="#ffffff"></path></g>
</svg>
`;
class VolumeBar extends BaseComponent {
  template = this.createTemplate`
  <gp-volume class="goldplay__volume-bar">
    <gp-overbox class="goldplay-hoverbox goldplay__volume-bar--handle">
      <span class="goldplay__volume-bar--precent">${"dataPrecent"}</span>
      <span class="goldplay__volume-bar--rod ${"volumeBarRodHoverCss"}" title="adjust volume"></span>
      <span class="goldplay__volume-bar--size">&nbsp;</span>
      <span class="goldplay__volume-bar--column">&nbsp;</span>
    </gp-overbox>
    <gp-button class="goldplay__volume-bar--audio ${"audioOffClass"}" title="${"title"}" data-mute="${"dataMute"}" data-volume-size="${"dataVolumeSize"}"  data-last-volume="${"dataLastVolume"}">
    ${"icon|html"}
    </gp-button>
  </gp-volume>
  `;
  options = {};
  data = {
    audioONHide: "",
    audioOffHide: "",
    audioOffClass: "",
    dataVolumeSize: "",
    dataPrecent: "",
    dataLastVolume: "",
    dataMute: "",
    volumeBarRodHoverCss: "",
    icon: AUDIO_ON_ICON,
    title: "turn off"
  };

  constructor(options = {}) {
    super(options);
    this.options = options;
    Object.assign(this.data, options.data);
    this.init();
  }

  watch() {
    this.data.dataPrecent = Math.floor(this.data.dataVolumeSize * 100);
    if (this.data.audioOffClass !== "") {
      this.data.dataMute = "true";
      this.data.audioOffHide = "inline-block";
      this.data.audioOnHide = "none";
      this.data.icon = AUDIO_OFF_ICON;
      this.data.title = "turn on";
    } else {
      this.data.dataMute = "";
      this.data.audioOffHide = "none";
      this.data.audioOnHide = "inline-block";
      this.data.icon = AUDIO_ON_ICON;
      this.data.title = "turn off";
    }
  }

  initProps() {
    const $volumeBar = this.element;
    const cssName = this.options.cssName;
    this.INIT_VOLUME_SIZE =
      this.options.player.defaultVolumeSize === undefined
        ? 0.5
        : this.options.player.defaultVolumeSize;
    this.$volumeBarHandle = $volumeBar.querySelector(
      "." + cssName.volumeBarHandle
    );
    this.$volumeBarRod = $volumeBar.querySelector("." + cssName.volumeBarRod);
    this.$volumeBarAudio = $volumeBar.querySelector(
      "." + cssName.volumeBarAudio
    );
    this.$volumeBarSize = $volumeBar.querySelector("." + cssName.volumeBarSize);
    this.$volumeBarColumn = $volumeBar.querySelector(
      "." + cssName.volumeBarColumn
    );
    this.volumeBarColumnHeight = this.$volumeBarColumn.offsetHeight;
    this.volumeBarColumnTop = this.$volumeBarColumn.offsetTop;
    this.volumeBarRodHeight = this.$volumeBarRod.offsetHeight;
    this.volumeBarRodHeightHalf = this.volumeBarRodHeight / 2;
    this.volumeBarColumnRealTop =
      this.volumeBarColumnTop + this.volumeBarRodHeightHalf;
    this.volumeBarColumnMaxHeight =
      this.volumeBarColumnHeight - this.volumeBarRodHeight;
  }

  bindEvent() {
    const $container = this.options.$controlBarContainer;
    const cssName = this.options.cssName;

    delegator($container).on("mouseover", "." + cssName.volumeBar, () => {
      clearTimeout(volumeBarHidetimer);
      this.showVolumeBarHandle();
    });

    delegator($container).on(
      "mousewheel",
      "." + cssName.volumeBarHandle,
      (evt) => {
        let volumeSize = evt.wheelDelta / 500;
        volumeSize = this.data.dataVolumeSize + volumeSize;
        this.setVolumeSize(volumeSize);
        evt.preventDefault();
        evt.stopPropagation();
        return;
      }
    );
    delegator($container).on(
      "click",
      ["." + cssName.volumeBarColumn, "." + cssName.volumeBarSize],
      (evt) => {
        let volumeSize = 0;
        if (evt.target === this.$volumeBarColumn) {
          volumeSize =
            (this.$volumeBarColumn.offsetHeight - evt.offsetY) /
            evt.target.offsetHeight;
        } else if (evt.target === this.$volumeBarSize) {
          volumeSize =
            this.$volumeBarColumn.offsetHeight -
            evt.target.offsetHeight +
            evt.offsetY;
          volumeSize = this.$volumeBarColumn.offsetHeight - volumeSize;
          volumeSize = volumeSize / this.$volumeBarColumn.offsetHeight;
        }
        this.setVolumeSize(volumeSize);
        return false;
      }
    );
    delegator($container).on("click", "." + cssName.volumeBarAudio, (evt) => {
      if (this.$volumeBarAudio.classList.contains(cssName.volumeBarAudioOff)) {
        this.setAudioOn(evt.offsetY);
      } else {
        this.setAudioOff(evt.offsetY);
      }
      return false;
    });

    let volumeBarHidetimer;
    const _inHandleScope = (evt) => {
      const $bar = this.element;
      const scope = {
        y: $bar.offsetTop + this.$volumeBarHandle.offsetTop,
        x: $bar.offsetLeft
      };
      scope.width = $bar.offsetWidth;
      scope.height = this.$volumeBarHandle.offsetHeight;
      if (
        evt.pageX > scope.x &&
        evt.pageX < scope.x + scope.width &&
        evt.pageY > scope.y &&
        evt.pageY < scope.y + scope.height
      ) {
        return true;
      } else {
        return false;
      }
    };
    delegator($container).on("mouseout", "." + cssName.volumeBar, (evt) => {
      volumeBarHidetimer = setTimeout(() => {
        if (!_inHandleScope(evt)) {
          this.hideVolumeBarHandle();
        } else {
          clearTimeout(volumeBarHidetimer);
        }
      }, Config.hideBarBoxTime);
    });

    this.volumeDragEvent = dragger(this.$volumeBarRod, {
      $container: this.element,
      type: "vertical",
      scope: {
        top: this.volumeBarColumnTop,
        right: 0,
        bottom: this.volumeBarColumnTop + this.volumeBarColumnHeight,
        left: 0
      },
      onStart: () => {
        this.data.volumeBarRodHoverCss = this.options.cssName.volumeBarRodHover;
      },
      onDrag: (offsetX, offsetY) => {
        offsetY -= 1;
        this.dragHandle(offsetY);
      },
      onRelease: () => {
        this.data.volumeBarRodHoverCss = "";
      }
    });
  }

  hideVolumeBarHandle() {
    this.$volumeBarHandle.style.visibility = "hidden";
  }

  showVolumeBarHandle() {
    this.$volumeBarHandle.style.visibility = "visible";
  }

  getVolume() {
    let volumeSize =
      (this.$volumeBarSize.offsetHeight - this.volumeBarRodHeight) /
      this.volumeBarColumnMaxHeight;
    volumeSize = Math.min(volumeSize, 1);
    volumeSize = Math.max(volumeSize, 0);
    return volumeSize.toFixed(2);
  }

  setVolume(value) {
    this.data.dataVolumeSize = Number(value);
    this.events.emit(Events.PlayerOnVolume, value);
  }

  initVolumeSize(muted = false) {
    this.data.dataLastVolume = muted ? 0 : this.INIT_VOLUME_SIZE;
    if (muted) {
      this.setAudioOff();
    } else {
      this.setAudioOn();
    }
  }

  setAudioOn() {
    const volume = this.data.dataLastVolume || 0;
    this.setVolume(volume);
    const volumeSize = parseFloat(volume, 10);
    const volumeHeight = Math.floor(volumeSize * this.volumeBarColumnMaxHeight);
    const volumeSizeTop =
      this.volumeBarColumnTop + (this.volumeBarColumnMaxHeight - volumeHeight);
    this.$volumeBarSize.style.marginTop = volumeSizeTop + "px";
    this.$volumeBarSize.style.height =
      volumeHeight + this.volumeBarRodHeight + "px";
    this.$volumeBarRod.style.top = volumeSizeTop + "px";
    this.data.audioOffClass = "";
  }

  setAudioOff() {
    this.setVolume(0);
    this.data.audioOffClass = this.options.cssName.volumeBarAudioOff;
    const volumeSize = this.getVolume();
    if (volumeSize > 0) {
      this.data.dataLastVolume = volumeSize;
    }
    this.$volumeBarSize.style.height = this.volumeBarRodHeight + "px";
    this.$volumeBarSize.style.marginTop =
      this.volumeBarColumnRealTop -
      this.volumeBarRodHeightHalf +
      this.volumeBarColumnMaxHeight +
      "px";
    this.$volumeBarRod.style.top =
      this.volumeBarColumnRealTop +
      this.volumeBarColumnMaxHeight -
      this.volumeBarRodHeightHalf +
      "px";
  }

  dragHandle(offsetY) {
    this.$volumeBarSize.style.marginTop = offsetY + 1 + "px";
    this.$volumeBarSize.style.height =
      this.volumeBarColumnHeight - offsetY + this.volumeBarRodHeight + "px";
    const volumeSize = this.getVolume();
    if (volumeSize <= 0) {
      this.setAudioOff(offsetY);
    } else if (this.data.dataMute == "true") {
      this.setAudioOn(offsetY);
    }
    this.setVolume(volumeSize);
  }

  setVolumeSize(volumeSize) {
    volumeSize = volumeSize.toFixed(2);
    if (volumeSize >= 1) {
      volumeSize = 1;
    } else if (volumeSize < 0.001) {
      volumeSize = 0;
    }

    if (volumeSize !== this.data.dataVolumeSize) {
      this.setVolume(volumeSize);
      const totalSize = this.volumeBarColumnMaxHeight;
      const offsetY = totalSize - volumeSize * totalSize;
      const marginTop = offsetY + this.volumeBarColumnTop;
      this.$volumeBarSize.style.marginTop = marginTop + "px";
      this.$volumeBarSize.style.height =
        volumeSize * totalSize + this.volumeBarRodHeight + "px";
      this.$volumeBarRod.style.top = marginTop + "px";

      if (volumeSize <= 0) {
        this.data.audioOffClass = this.options.cssName.volumeBarAudioOff;
      } else if (this.data.dataMute == "true") {
        this.data.audioOffClass = "";
      }
    }
  }
}

export default VolumeBar;
