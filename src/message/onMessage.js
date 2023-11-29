import Store3D from "../homeIndex";
import { SUNNY, RAIN, SNOW, DAY, NIGHT, SCIENCE } from "../components/weather";

// 因为管控部分版本没有更新，所以需要这个映射表
const TransformMap = {
  sunny: SUNNY,
  rain: RAIN,
  snow: SNOW,
  day: DAY,
  night: NIGHT,
  science: SCIENCE,
  [SUNNY]: SUNNY,
  [RAIN]: RAIN,
  [SNOW]: SNOW,
  [DAY]: DAY,
  [NIGHT]: NIGHT,
  [SCIENCE]: SCIENCE,
};

export const onMessage = () => {
  window.addEventListener("message", event => {
    if (event.data && event.data.cmd) {
      switch (event.data.cmd) {
        case "changeLighting": {
          const param = TransformMap[event.data.param];
          Store3D.changeLighting(param);
          break;
        }
        case "changeWeather": {
          const param = event.data.param;
          param.type = TransformMap[param.type];
          Store3D.changeWeather(param);
          break;
        }
        case "changeView":
          Store3D.changeView(event.data.param);
          break;
        case "close":
          Store3D._stopRender();
          break;
        case "open":
          Store3D._beginRender();
          break;
        case "setWarning":
          Store3D.setWarning(event.data.param);
          break;
        case "setCameraState":
          Store3D.setCameraState(event.data.param);
          break;
        case "changeRouter":
          Store3D.changeRouter(event.data.param);
          break;
      }
    }
  });
};
