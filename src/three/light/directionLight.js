import { DirectionalLight } from "three";
const directionalLight = new DirectionalLight(0xffffff, 3);
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 3500;
directionalLight.shadow.camera.right = 2500;
directionalLight.shadow.camera.left = -2500;
directionalLight.shadow.camera.top = 1500;
directionalLight.shadow.camera.bottom = -1500;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.radius = 1.1;
directionalLight.shadow.bias = 0.01;

directionalLight.position.set(-80, 130, 100);
directionalLight.castShadow = true;

export { directionalLight };
