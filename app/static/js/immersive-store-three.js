import * as THREE from "https://esm.sh/three@0.161.0";
import { PointerLockControls } from "https://esm.sh/three@0.161.0/examples/jsm/controls/PointerLockControls.js";

const root = document.getElementById("shelf-3d-view");
if (!root) {
  throw new Error("Immersive store root not found");
}

const safeParse = (rawValue) => {
  try {
    const parsed = JSON.parse(rawValue || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const sceneData = safeParse(root.dataset.scene);
if (sceneData.length === 0) {
  root.innerHTML = `<p class="shelf-scene-empty">${root.dataset.emptyMessage || "No hay datos"}</p>`;
} else {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    root.innerHTML = `<p class="shelf-scene-empty">${root.dataset.emptyMessage || "No hay datos"}</p>`;
  }
  if (!renderer) {
    throw new Error("WebGL renderer unavailable");
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(root.clientWidth, root.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.physicallyCorrectLights = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcfe4f8);
  scene.fog = new THREE.Fog(0xcfe4f8, 32, 120);

  const camera = new THREE.PerspectiveCamera(72, root.clientWidth / root.clientHeight, 0.1, 180);
  camera.position.set(0, 1.65, 11);

  const controls = new PointerLockControls(camera, root);
  scene.add(controls.getObject());

  const hemiLight = new THREE.HemisphereLight(0xe6f4ff, 0x7f93aa, 1.05);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(10, 13, 9);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 45;
  keyLight.shadow.camera.left = -18;
  keyLight.shadow.camera.right = 18;
  keyLight.shadow.camera.top = 18;
  keyLight.shadow.camera.bottom = -18;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xf4fbff, 1.05);
  fillLight.position.set(-10, 8, -6);
  scene.add(fillLight);

  const aisleLight = new THREE.SpotLight(0xfff2d6, 3.2, 85, Math.PI / 4.8, 0.32, 1.05);
  aisleLight.position.set(0, 7.8, -8);
  aisleLight.target.position.set(0, 1.5, 4);
  aisleLight.castShadow = true;
  scene.add(aisleLight);
  scene.add(aisleLight.target);

  const textureLoader = new THREE.TextureLoader();

  const createSupermarketFloorTexture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }

    context.fillStyle = "#eef3f8";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const tileSize = 64;
    context.strokeStyle = "#d5dde7";
    context.lineWidth = 2;
    for (let i = 0; i <= canvas.width; i += tileSize) {
      context.beginPath();
      context.moveTo(i, 0);
      context.lineTo(i, canvas.height);
      context.stroke();

      context.beginPath();
      context.moveTo(0, i);
      context.lineTo(canvas.width, i);
      context.stroke();
    }

    for (let i = 0; i < 2200; i += 1) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const alpha = 0.04 + Math.random() * 0.04;
      context.fillStyle = `rgba(120, 140, 160, ${alpha})`;
      context.fillRect(x, y, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  const createStockedShelfWallTexture = (seedOffset = 0) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }

    context.fillStyle = "#f4f7fb";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#e7eef7";
    context.fillRect(0, 0, canvas.width, 42);

    const shelfRows = 4;
    const rowHeight = canvas.height / shelfRows;

    const zoneProfiles = [
      {
        name: "BEBIDAS",
        colors: ["#1d4ed8", "#0ea5e9", "#22c55e", "#ef4444"],
        widthRange: [24, 40],
        heightRange: [48, 80],
        gap: [4, 7],
        promos: ["2x1", "-15%"],
      },
      {
        name: "LIMPIEZA",
        colors: ["#2563eb", "#14b8a6", "#f59e0b", "#f97316"],
        widthRange: [26, 46],
        heightRange: [42, 74],
        gap: [5, 8],
        promos: ["OFERTA", "-20%"],
      },
      {
        name: "SNACKS",
        colors: ["#e11d48", "#f97316", "#eab308", "#84cc16", "#a855f7"],
        widthRange: [20, 34],
        heightRange: [24, 58],
        gap: [3, 6],
        promos: ["NUEVO", "-10%"],
      },
      {
        name: "CAJAS",
        colors: ["#7c3aed", "#ec4899", "#10b981", "#f43f5e"],
        widthRange: [18, 30],
        heightRange: [22, 44],
        gap: [2, 5],
        promos: ["PACK", "AHORRO"],
      },
    ];

    const zoneWidth = canvas.width / zoneProfiles.length;

    const pickRange = (range) => range[0] + Math.random() * (range[1] - range[0]);

    for (let row = 0; row < shelfRows; row += 1) {
      const yStart = row * rowHeight;

      context.fillStyle = "#d7dee8";
      context.fillRect(0, yStart + rowHeight - 18, canvas.width, 18);

      zoneProfiles.forEach((zone, zoneIndex) => {
        const xZoneStart = zoneIndex * zoneWidth;
        const xZoneEnd = xZoneStart + zoneWidth;

        if (row === 0) {
          context.fillStyle = "#64748b";
          context.font = "600 14px Inter, Arial";
          context.fillText(zone.name, xZoneStart + 10, 28 + ((zoneIndex + seedOffset) % 2));

          const promoText = zone.promos[(zoneIndex + seedOffset) % zone.promos.length];
          const promoWidth = 56;
          const promoX = xZoneEnd - promoWidth - 10;
          const promoY = 11;

          context.fillStyle = "#ef4444";
          context.fillRect(promoX, promoY, promoWidth, 18);
          context.fillStyle = "#ffffff";
          context.font = "700 11px Inter, Arial";
          context.fillText(promoText, promoX + 8, promoY + 13);
        }

        let x = xZoneStart + 8;
        while (x < xZoneEnd - 14) {
          const boxWidth = pickRange(zone.widthRange);
          const boxHeight = pickRange(zone.heightRange);
          const y = yStart + rowHeight - 20 - boxHeight;
          const color = zone.colors[Math.floor(Math.random() * zone.colors.length)];

          context.fillStyle = color;
          context.fillRect(x, y, boxWidth, boxHeight);

          context.fillStyle = "rgba(255,255,255,0.42)";
          context.fillRect(x + 2, y + 2, Math.max(8, boxWidth - 4), 3);

          context.fillStyle = "rgba(15,23,42,0.15)";
          context.fillRect(x + 3, y + boxHeight - 9, Math.max(6, boxWidth - 6), 2);

          x += boxWidth + pickRange(zone.gap);
        }
      });

      if (row > 0 && row < shelfRows) {
        for (let i = 0; i < zoneProfiles.length; i += 1) {
          if (Math.random() < 0.38) {
            const xBase = i * zoneWidth + 14 + Math.random() * (zoneWidth - 52);
            const yBase = yStart + rowHeight - 34 - Math.random() * 18;
            context.fillStyle = "#facc15";
            context.fillRect(xBase, yBase, 34, 14);
            context.fillStyle = "#1f2937";
            context.font = "700 9px Inter, Arial";
            context.fillText("OFERTA", xBase + 3, yBase + 10);
          }
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  const createPromoSignTexture = (title, subtitle, bgColor, accentColor) => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }

    context.fillStyle = bgColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = accentColor;
    context.fillRect(0, 0, canvas.width, 42);

    context.fillStyle = "#ffffff";
    context.font = "700 78px Inter, Arial";
    context.fillText(title, 28, 140);

    context.font = "600 34px Inter, Arial";
    context.fillText(subtitle, 30, 206);

    context.strokeStyle = "rgba(255,255,255,0.35)";
    context.lineWidth = 5;
    context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  const floorTexture = createSupermarketFloorTexture() ?? textureLoader.load("https://threejs.org/examples/textures/uv_grid_opengl.jpg");
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(14, 22);
  floorTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(56, 92),
    new THREE.MeshStandardMaterial({ color: 0xf5f8fc, map: floorTexture, roughness: 0.62, metalness: 0.02 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(56, 92),
    new THREE.MeshStandardMaterial({ color: 0xeaf2fb, roughness: 0.92, metalness: 0 })
  );
  ceiling.position.y = 8.7;
  ceiling.rotation.x = Math.PI / 2;
  scene.add(ceiling);

  const shelfWallTexture = createStockedShelfWallTexture(0) ?? textureLoader.load("https://threejs.org/examples/textures/brick_diffuse.jpg");
  shelfWallTexture.wrapS = THREE.RepeatWrapping;
  shelfWallTexture.wrapT = THREE.RepeatWrapping;
  shelfWallTexture.repeat.set(3.2, 1.2);
  shelfWallTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const sideShelfWallTexture = createStockedShelfWallTexture(1) ?? shelfWallTexture;
  sideShelfWallTexture.wrapS = THREE.RepeatWrapping;
  sideShelfWallTexture.wrapT = THREE.RepeatWrapping;
  sideShelfWallTexture.repeat.set(4.6, 1.2);
  sideShelfWallTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const backWallMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: shelfWallTexture,
    roughness: 0.62,
    metalness: 0.02,
    emissive: 0x1b2636,
    emissiveIntensity: 0.05,
  });
  const sideWallMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: sideShelfWallTexture,
    roughness: 0.64,
    metalness: 0.02,
    emissive: 0x1b2636,
    emissiveIntensity: 0.05,
  });

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(56, 9), backWallMaterial);
  backWall.position.set(0, 4.5, -44);
  scene.add(backWall);

  const sideWallLeft = new THREE.Mesh(new THREE.PlaneGeometry(92, 9), sideWallMaterial);
  sideWallLeft.rotation.y = Math.PI / 2;
  sideWallLeft.position.set(-28, 4.5, 0);
  scene.add(sideWallLeft);

  const sideWallRight = sideWallLeft.clone();
  sideWallRight.position.set(28, 4.5, 0);
  scene.add(sideWallRight);

  const createHangingPromoSign = (zPosition, signTexture) => {
    const signGroup = new THREE.Group();
    signGroup.position.set(0, 6.6, zPosition);

    const signBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 1.15),
      new THREE.MeshStandardMaterial({ map: signTexture, roughness: 0.46, metalness: 0.06 })
    );
    signBoard.castShadow = true;
    signGroup.add(signBoard);

    const chainMaterial = new THREE.MeshStandardMaterial({ color: 0xaab4c2, roughness: 0.45, metalness: 0.7 });
    const chainGeom = new THREE.CylinderGeometry(0.012, 0.012, 1.0, 10);

    const chainLeft = new THREE.Mesh(chainGeom, chainMaterial);
    chainLeft.position.set(-1.1, 0.52, 0);
    signGroup.add(chainLeft);

    const chainRight = chainLeft.clone();
    chainRight.position.x = 1.1;
    signGroup.add(chainRight);

    scene.add(signGroup);
  };

  const promoTextures = [
    createPromoSignTexture("2x1", "Solo esta semana", "#dc2626", "#991b1b"),
    createPromoSignTexture("-20%", "En limpieza", "#0369a1", "#075985"),
    createPromoSignTexture("OFERTA", "Precios bajos", "#16a34a", "#166534"),
  ].filter((texture) => texture !== null);

  if (promoTextures.length > 0) {
    const signZPositions = [9, 1, -7, -15, -23, -31];
    signZPositions.forEach((zPosition, index) => {
      const texture = promoTextures[index % promoTextures.length];
      createHangingPromoSign(zPosition, texture);
    });
  }

  const shelfGroup = new THREE.Group();
  const productLoader = textureLoader;

  const woodTexture = textureLoader.load("https://threejs.org/examples/textures/hardwood2_diffuse.jpg");
  woodTexture.wrapS = THREE.RepeatWrapping;
  woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.repeat.set(1.2, 0.55);
  woodTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  woodTexture.colorSpace = THREE.SRGBColorSpace;

  const shelfFrameMaterial = new THREE.MeshStandardMaterial({
    color: 0xb9895e,
    map: woodTexture,
    roughness: 0.66,
    metalness: 0.04,
  });
  const shelfBoardMaterial = new THREE.MeshStandardMaterial({
    color: 0xcf9e70,
    map: woodTexture,
    roughness: 0.62,
    metalness: 0.03,
  });

  const aisleSpacing = 5.4;
  const rowDepth = 3.8;

  const makeShelfUnit = (x, z, shelf) => {
    const shelfUnit = new THREE.Group();
    shelfUnit.position.set(x, 0, z);

    const frameHeight = 3.4;
    const frameWidth = 2.9;
    const frameDepth = 1.05;

    const frameGeom = new THREE.BoxGeometry(0.08, frameHeight, frameDepth);
    const postLeft = new THREE.Mesh(frameGeom, shelfFrameMaterial);
    postLeft.position.set(-frameWidth / 2, frameHeight / 2, 0);
    postLeft.castShadow = true;

    const postRight = postLeft.clone();
    postRight.position.x = frameWidth / 2;

    shelfUnit.add(postLeft, postRight);

    const boardGeom = new THREE.BoxGeometry(frameWidth + 0.12, 0.09, frameDepth + 0.16);
    const levels = [0.48, 1.2, 1.92, 2.64];
    levels.forEach((levelY) => {
      const board = new THREE.Mesh(boardGeom, shelfBoardMaterial);
      board.position.set(0, levelY, 0);
      board.castShadow = true;
      board.receiveShadow = true;
      shelfUnit.add(board);
    });

    const titlePanel = new THREE.Mesh(
      new THREE.PlaneGeometry(frameWidth, 0.38),
      new THREE.MeshStandardMaterial({ color: 0xc8d8ea, emissive: 0x9ec4ea, emissiveIntensity: 0.35 })
    );
    titlePanel.position.set(0, 3.08, frameDepth / 2 + 0.02);
    shelfUnit.add(titlePanel);

    const products = Array.isArray(shelf.products) ? shelf.products : [];
    const sortedProducts = [...products].sort((a, b) => (b.shelfCount || 0) - (a.shelfCount || 0));
    const maxProducts = Math.min(sortedProducts.length, 20);

    for (let index = 0; index < maxProducts; index += 1) {
      const product = sortedProducts[index];
      const level = levels[index % levels.length] + 0.16;
      const slot = Math.floor(index / levels.length);
      const col = slot % 4;
      const row = Math.floor(slot / 4);

      const productHeight = 0.26 + ((product.shelfCount || 1) % 3) * 0.06;
      const productWidth = 0.26;
      const productDepth = 0.22;

      const productGeom = new THREE.BoxGeometry(productWidth, productHeight, productDepth);
      const imageUrl = typeof product.productImage === "string" ? product.productImage : "";
      const texture = imageUrl ? productLoader.load(imageUrl) : null;
      if (texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
      }

      const productMaterial = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        map: texture,
        roughness: 0.35,
        metalness: 0.05,
      });

      const productMesh = new THREE.Mesh(productGeom, productMaterial);
      productMesh.position.set(-0.9 + col * 0.62, level + row * 0.04, 0.34 - row * 0.26);
      productMesh.castShadow = true;
      shelfUnit.add(productMesh);
    }

    shelfGroup.add(shelfUnit);
  };

  sceneData.forEach((shelf, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const row = Math.floor(index / 2);
    const x = side * rowDepth;
    const z = 8 - row * aisleSpacing;
    makeShelfUnit(x, z, shelf);
  });

  scene.add(shelfGroup);

  for (let z = 12; z >= -36; z -= 8) {
    const overhead = new THREE.PointLight(0xffffff, 1.35, 22, 2);
    overhead.position.set(0, 7.2, z);
    scene.add(overhead);
  }

  const ambientDeco = new THREE.PointLight(0x7ec9ff, 1.4, 20, 2);
  ambientDeco.position.set(0, 2.2, 14);
  scene.add(ambientDeco);

  const hud = root.querySelector(".immersive-hud");
  const startButton = root.querySelector('[data-action="start-immersive"]');

  const moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
  };

  const velocity = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const minX = -24;
  const maxX = 24;
  const minZ = -42;
  const maxZ = 20;

  const keyMap = {
    ArrowUp: "forward",
    ArrowDown: "backward",
    ArrowLeft: "left",
    ArrowRight: "right",
  };

  const onKey = (event, isPressed) => {
    if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
      moveState.sprint = isPressed;
      return;
    }

    const mapped = keyMap[event.code];
    if (mapped) {
      moveState[mapped] = isPressed;
    }
  };

  document.addEventListener("keydown", (event) => onKey(event, true));
  document.addEventListener("keyup", (event) => onKey(event, false));

  const clock = new THREE.Clock();

  const animate = () => {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);
    if (controls.isLocked) {
      const damping = 8.8 * delta;
      velocity.x -= velocity.x * damping;
      velocity.z -= velocity.z * damping;

      direction.z = Number(moveState.forward) - Number(moveState.backward);
      direction.x = Number(moveState.right) - Number(moveState.left);
      direction.normalize();

      const speed = moveState.sprint ? 8.2 : 4.8;

      if (moveState.forward || moveState.backward) {
        velocity.z -= direction.z * speed * delta;
      }
      if (moveState.left || moveState.right) {
        velocity.x -= direction.x * speed * delta;
      }

      controls.moveRight(-velocity.x);
      controls.moveForward(-velocity.z);

      const cameraPos = controls.getObject().position;
      cameraPos.x = Math.max(minX, Math.min(maxX, cameraPos.x));
      cameraPos.z = Math.max(minZ, Math.min(maxZ, cameraPos.z));
      cameraPos.y = 1.65;
    }

    renderer.render(scene, camera);
  };

  controls.addEventListener("lock", () => {
    root.classList.add("is-active");
    hud?.classList.add("is-hidden");
  });

  controls.addEventListener("unlock", () => {
    root.classList.remove("is-active");
    hud?.classList.remove("is-hidden");
  });

  startButton?.addEventListener("click", () => {
    controls.lock();
  });

  const onResize = () => {
    const width = root.clientWidth;
    const height = root.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };

  window.addEventListener("resize", onResize);

  root.appendChild(renderer.domElement);
  animate();
}
