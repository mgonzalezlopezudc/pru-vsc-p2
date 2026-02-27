import * as THREE from "https://esm.sh/three@0.161.0";
import { PointerLockControls } from "https://esm.sh/three@0.161.0/examples/jsm/controls/PointerLockControls.js";
import { GLTFLoader } from "https://esm.sh/three@0.161.0/examples/jsm/loaders/GLTFLoader.js";

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
  const gltfLoader = new GLTFLoader();
  const loadedProductModels = new Map();

  const productModelByName = {
    lemonade: "waterbottle_jeremy.glb",
    "orange juice": "juicecup_ccby.glb",
    "sparkling water": "waterbottle_quaternius.glb",
    "still water": "bottle_quaternius.glb",
    cola: "source/cola.glb",
    "iced tea": "frappe_kenney.glb",
    "potato chips": "chips_creativetrio.glb",
    "salted nuts": "peanut_ccby.glb",
    "chocolate bar": "chocolatebar_cc0.glb",
    "protein bar": "candybarwrapper_cc0.glb",
  };

  const modelAttributionByFile = {
    "waterbottle_jeremy.glb": {
      author: "jeremy",
      license: "CC BY",
      source: "poly.pizza/m/b54HnwJAXsb",
    },
    "juicecup_ccby.glb": {
      author: "Poly Pizza author",
      license: "CC BY",
      source: "poly.pizza/m/1dtgLpiHRXG",
    },
    "waterbottle_quaternius.glb": {
      author: "Quaternius",
      license: "CC0",
      source: "poly.pizza/m/KpxDpidn1Z",
    },
    "bottle_quaternius.glb": {
      author: "Quaternius",
      license: "CC0",
      source: "poly.pizza/m/Pc8dM9Ja4V",
    },
    "source/cola.glb": {
      author: "Aportado por el usuario",
      license: "No especificada",
      source: "",
    },
    "can_quaternius.glb": {
      author: "Quaternius",
      license: "CC0",
      source: "poly.pizza/m/YnowJvWqxE",
    },
    "frappe_kenney.glb": {
      author: "Kenney",
      license: "CC0",
      source: "poly.pizza/m/ZvYPiZeN0V",
    },
    "chips_creativetrio.glb": {
      author: "CreativeTrio",
      license: "CC0",
      source: "poly.pizza/m/uF1dGn3HXi",
    },
    "peanut_ccby.glb": {
      author: "Poly Pizza author",
      license: "CC BY",
      source: "poly.pizza/m/1KRzEPIJwax",
    },
    "chocolatebar_cc0.glb": {
      author: "Poly Pizza author",
      license: "CC0",
      source: "poly.pizza/m/vJsJ1EIiOO",
    },
    "candybarwrapper_cc0.glb": {
      author: "Poly Pizza author",
      license: "CC0",
      source: "poly.pizza/m/ZeJW3KyeTH",
    },
  };

  const modelPathPrefix = "/static/models/products/";

  const loadProductModel = (fileName) =>
    new Promise((resolve) => {
      gltfLoader.load(
        `${modelPathPrefix}${fileName}`,
        (gltf) => resolve(gltf?.scene ?? null),
        undefined,
        () => resolve(null)
      );
    });

  const preloadProductModels = async () => {
    const uniqueFiles = [...new Set(Object.values(productModelByName))];
    await Promise.all(
      uniqueFiles.map(async (fileName) => {
        const modelScene = await loadProductModel(fileName);
        if (modelScene) {
          loadedProductModels.set(fileName, modelScene);
        }
      })
    );
  };

  const normalizeProductName = (name) => String(name || "").toLowerCase();

  const hashString = (value) => {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(index);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const createPhysicalMaterial = ({
    color,
    roughness,
    metalness,
    clearcoat = 0,
    clearcoatRoughness = 0.25,
    transmission = 0,
    thickness = 0,
    ior = 1.45,
    emissive = 0x000000,
    emissiveIntensity = 0,
  }) =>
    new THREE.MeshPhysicalMaterial({
      color,
      roughness,
      metalness,
      clearcoat,
      clearcoatRoughness,
      transmission,
      thickness,
      ior,
      emissive,
      emissiveIntensity,
    });

  const inferProductProfile = (productName) => {
    const normalized = normalizeProductName(productName);
    if (normalized.includes("cola") || normalized.includes("soda")) {
      return "can";
    }
    if (
      normalized.includes("water") ||
      normalized.includes("lemonade") ||
      normalized.includes("tea") ||
      normalized.includes("drink")
    ) {
      return "bottle";
    }
    if (normalized.includes("juice")) {
      return "carton";
    }
    if (normalized.includes("chips")) {
      return "bag";
    }
    if (normalized.includes("nuts")) {
      return "jar";
    }
    if (normalized.includes("bar") || normalized.includes("chocolate") || normalized.includes("protein")) {
      return "bar";
    }
    return "box";
  };

  const paletteByProfile = {
    bottle: [0x3b82f6, 0x22c55e, 0x14b8a6, 0xf59e0b],
    can: [0xdc2626, 0x2563eb, 0xf59e0b, 0x22c55e],
    carton: [0xf97316, 0x16a34a, 0x0284c7, 0xbe123c],
    bag: [0xef4444, 0xf97316, 0xeab308, 0x7c3aed],
    jar: [0x84cc16, 0x65a30d, 0x15803d, 0xa3e635],
    bar: [0x7c3aed, 0xec4899, 0xb45309, 0x1d4ed8],
    box: [0x64748b, 0x0ea5e9, 0x9333ea, 0xf97316],
  };

  const selectProductColor = (profile, productName) => {
    const palette = paletteByProfile[profile] || paletteByProfile.box;
    const colorIndex = hashString(normalizeProductName(productName)) % palette.length;
    return palette[colorIndex];
  };

  const createProductLabel = (product, width, height, zOffset) => {
    const imageUrl = typeof product.productImage === "string" ? product.productImage : "";
    if (!imageUrl) {
      return null;
    }

    const labelTexture = productLoader.load(imageUrl);
    labelTexture.colorSpace = THREE.SRGBColorSpace;
    labelTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const labelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      createPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.03,
        clearcoat: 0.45,
      })
    );
    labelMesh.material.map = labelTexture;
    labelMesh.position.set(0, 0, zOffset);
    return labelMesh;
  };

  const createProductMesh = (product) => {
    const profile = inferProductProfile(product.productName);
    const primaryColor = selectProductColor(profile, product.productName);
    const productGroup = new THREE.Group();
    const visualScaleBoost = 1.2;
    const stockFactor = Math.max(0.85, Math.min((product.shelfCount || 1) / 8, 1.25)) * visualScaleBoost;
    const normalizedName = normalizeProductName(product.productName);
    const mappedModelFile = productModelByName[normalizedName];
    const attributionSource = modelAttributionByFile[mappedModelFile];
    const attributionSummary = attributionSource
      ? `${attributionSource.author} · ${attributionSource.license}`
      : "Modelo procedural";

    if (mappedModelFile && loadedProductModels.has(mappedModelFile)) {
      const templateModel = loadedProductModels.get(mappedModelFile);
      const modelClone = templateModel.clone(true);

      modelClone.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material?.map) {
            child.material.map.colorSpace = THREE.SRGBColorSpace;
          }
        }
      });

      const preScaleBox = new THREE.Box3().setFromObject(modelClone);
      const preScaleSize = preScaleBox.getSize(new THREE.Vector3());
      const safeSize = new THREE.Vector3(
        Math.max(preScaleSize.x, 0.0001),
        Math.max(preScaleSize.y, 0.0001),
        Math.max(preScaleSize.z, 0.0001)
      );
      const profileMaxSize = {
        bottle: new THREE.Vector3(0.34, 0.58, 0.3),
        can: new THREE.Vector3(0.34, 0.54, 0.3),
        carton: new THREE.Vector3(0.4, 0.66, 0.34),
        bag: new THREE.Vector3(0.46, 0.62, 0.28),
        jar: new THREE.Vector3(0.4, 0.56, 0.34),
        bar: new THREE.Vector3(0.44, 0.2, 0.2),
        box: new THREE.Vector3(0.4, 0.5, 0.34),
      };
      const targetBox = (profileMaxSize[profile] || profileMaxSize.box).clone().multiplyScalar(stockFactor);
      const scale = Math.min(targetBox.x / safeSize.x, targetBox.y / safeSize.y, targetBox.z / safeSize.z);
      modelClone.scale.setScalar(scale);

      const fittedBox = new THREE.Box3().setFromObject(modelClone);
      const fittedCenter = fittedBox.getCenter(new THREE.Vector3());
      modelClone.position.x -= fittedCenter.x;
      modelClone.position.z -= fittedCenter.z;
      modelClone.position.y -= fittedBox.min.y;

      modelClone.userData.productName = product.productName;
      modelClone.userData.productAttribution = attributionSummary;
      modelClone.userData.productSource = attributionSource?.source || "";
      productGroup.add(modelClone);
    } else if (profile === "bottle") {
      const bottleBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 0.32 * stockFactor, 24),
        createPhysicalMaterial({
          color: primaryColor,
          roughness: 0.16,
          metalness: 0.02,
          clearcoat: 0.95,
          clearcoatRoughness: 0.1,
          transmission: 0.12,
          thickness: 0.08,
          ior: 1.42,
        })
      );
      bottleBody.position.y = 0.16 * stockFactor;
      bottleBody.castShadow = true;
      productGroup.add(bottleBody);

      const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.052, 0.1, 18),
        createPhysicalMaterial({
          color: 0xf8fafc,
          roughness: 0.24,
          metalness: 0.01,
          clearcoat: 0.6,
          transmission: 0.2,
          thickness: 0.04,
        })
      );
      neck.position.y = 0.35 * stockFactor;
      neck.castShadow = true;
      productGroup.add(neck);

      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 0.05, 16),
        createPhysicalMaterial({
          color: 0x1e293b,
          roughness: 0.35,
          metalness: 0.05,
          clearcoat: 0.2,
        })
      );
      cap.position.y = 0.42 * stockFactor;
      cap.castShadow = true;
      productGroup.add(cap);

      const label = createProductLabel(product, 0.13, 0.16, 0.101);
      if (label) {
        label.position.y = 0.17 * stockFactor;
        productGroup.add(label);
      }
    } else if (profile === "can") {
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.3 * stockFactor, 28),
        createPhysicalMaterial({
          color: primaryColor,
          roughness: 0.24,
          metalness: 0.7,
          clearcoat: 0.85,
          clearcoatRoughness: 0.08,
        })
      );
      body.position.y = 0.15 * stockFactor;
      body.castShadow = true;
      productGroup.add(body);

      const lid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.102, 0.102, 0.018, 28),
        createPhysicalMaterial({
          color: 0xd1d5db,
          roughness: 0.2,
          metalness: 0.9,
          clearcoat: 0.12,
        })
      );
      lid.position.y = 0.302 * stockFactor;
      lid.castShadow = true;
      productGroup.add(lid);

      const label = createProductLabel(product, 0.16, 0.16, 0.101);
      if (label) {
        label.position.y = 0.15 * stockFactor;
        productGroup.add(label);
      }
    } else if (profile === "carton") {
      const carton = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.34 * stockFactor, 0.14),
        createPhysicalMaterial({
          color: primaryColor,
          roughness: 0.36,
          metalness: 0.04,
          clearcoat: 0.42,
        })
      );
      carton.position.y = 0.17 * stockFactor;
      carton.castShadow = true;
      productGroup.add(carton);

      const topFold = new THREE.Mesh(
        new THREE.ConeGeometry(0.09, 0.12, 4),
        createPhysicalMaterial({
          color: 0xf8fafc,
          roughness: 0.3,
          metalness: 0,
          clearcoat: 0.25,
        })
      );
      topFold.rotation.y = Math.PI / 4;
      topFold.position.y = 0.39 * stockFactor;
      topFold.castShadow = true;
      productGroup.add(topFold);

      const label = createProductLabel(product, 0.14, 0.2, 0.071);
      if (label) {
        label.position.y = 0.19 * stockFactor;
        productGroup.add(label);
      }
    } else if (profile === "bag") {
      const bag = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.11, 0.2 * stockFactor, 8, 16),
        createPhysicalMaterial({
          color: primaryColor,
          roughness: 0.48,
          metalness: 0.02,
          clearcoat: 0.35,
          clearcoatRoughness: 0.32,
        })
      );
      bag.scale.set(1, 1.12, 0.62);
      bag.position.y = 0.17 * stockFactor;
      bag.castShadow = true;
      productGroup.add(bag);

      const label = createProductLabel(product, 0.15, 0.15, 0.082);
      if (label) {
        label.position.y = 0.18 * stockFactor;
        productGroup.add(label);
      }
    } else if (profile === "jar") {
      const jar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.26 * stockFactor, 24),
        createPhysicalMaterial({
          color: 0x8ba83d,
          roughness: 0.14,
          metalness: 0,
          clearcoat: 0.95,
          clearcoatRoughness: 0.08,
          transmission: 0.32,
          thickness: 0.08,
          ior: 1.5,
        })
      );
      jar.position.y = 0.13 * stockFactor;
      jar.castShadow = true;
      productGroup.add(jar);

      const lid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.105, 0.105, 0.06, 20),
        createPhysicalMaterial({
          color: primaryColor,
          roughness: 0.26,
          metalness: 0.18,
          clearcoat: 0.35,
        })
      );
      lid.position.y = 0.29 * stockFactor;
      lid.castShadow = true;
      productGroup.add(lid);

      const label = createProductLabel(product, 0.16, 0.12, 0.101);
      if (label) {
        label.position.y = 0.13 * stockFactor;
        productGroup.add(label);
      }
    } else if (profile === "bar") {
      const barPack = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.085, 0.1),
        createPhysicalMaterial({
          color: primaryColor,
          roughness: 0.34,
          metalness: 0.06,
          clearcoat: 0.55,
          clearcoatRoughness: 0.18,
          emissive: 0x1e1b4b,
          emissiveIntensity: 0.05,
        })
      );
      barPack.position.y = 0.043;
      barPack.castShadow = true;
      productGroup.add(barPack);

      const wrapperFoldLeft = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.06, 0.1),
        createPhysicalMaterial({ color: 0xf8fafc, roughness: 0.45, metalness: 0.02, clearcoat: 0.12 })
      );
      wrapperFoldLeft.position.set(-0.13, 0.043, 0);
      productGroup.add(wrapperFoldLeft);

      const wrapperFoldRight = wrapperFoldLeft.clone();
      wrapperFoldRight.position.x = 0.13;
      productGroup.add(wrapperFoldRight);

      const label = createProductLabel(product, 0.2, 0.06, 0.052);
      if (label) {
        label.position.y = 0.043;
        productGroup.add(label);
      }
    } else {
      const genericBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.24 * stockFactor, 0.16),
        createPhysicalMaterial({
          color: primaryColor,
          roughness: 0.36,
          metalness: 0.05,
          clearcoat: 0.42,
        })
      );
      genericBox.position.y = 0.12 * stockFactor;
      genericBox.castShadow = true;
      productGroup.add(genericBox);

      const label = createProductLabel(product, 0.15, 0.14, 0.081);
      if (label) {
        label.position.y = 0.12 * stockFactor;
        productGroup.add(label);
      }
    }

    const contactShadow = new THREE.Mesh(
      new THREE.CircleGeometry(profile === "bar" ? 0.11 : 0.13, 20),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, transparent: true, opacity: 0.2, roughness: 1, metalness: 0 })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.003;
    productGroup.add(contactShadow);

    productGroup.userData.productName = product.productName;
    productGroup.userData.productAttribution = attributionSummary;
    productGroup.userData.productSource = attributionSource?.source || "";

    if (profile === "bar") {
      productGroup.rotation.x = -0.55;
      productGroup.rotation.z = 0.45;
      productGroup.position.y += 0.03;
    }

    productGroup.rotation.y = (hashString(normalizeProductName(product.productName)) % 17) * 0.04 - 0.28;
    return productGroup;
  };

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

      const productMesh = createProductMesh(product);
      productMesh.position.set(-0.9 + col * 0.62, level + row * 0.04, 0.34 - row * 0.26);
      shelfUnit.add(productMesh);
    }

    shelfGroup.add(shelfUnit);
  };

  let shelvesBuilt = false;
  const buildShelves = () => {
    if (shelvesBuilt) {
      return;
    }

    sceneData.forEach((shelf, index) => {
      const side = index % 2 === 0 ? -1 : 1;
      const row = Math.floor(index / 2);
      const x = side * rowDepth;
      const z = 8 - row * aisleSpacing;
      makeShelfUnit(x, z, shelf);
    });

    scene.add(shelfGroup);
    shelvesBuilt = true;
  };

  for (let z = 12; z >= -36; z -= 8) {
    const overhead = new THREE.PointLight(0xffffff, 1.35, 22, 2);
    overhead.position.set(0, 7.2, z);
    scene.add(overhead);
  }

  const leftAccent = new THREE.SpotLight(0xf3f7ff, 2.4, 60, Math.PI / 5.2, 0.42, 1.1);
  leftAccent.position.set(-8, 5.8, -10);
  leftAccent.target.position.set(-4, 1.6, -14);
  scene.add(leftAccent);
  scene.add(leftAccent.target);

  const rightAccent = new THREE.SpotLight(0xfff8ea, 2.2, 60, Math.PI / 5.3, 0.42, 1.05);
  rightAccent.position.set(8, 5.8, -10);
  rightAccent.target.position.set(4, 1.6, -14);
  scene.add(rightAccent);
  scene.add(rightAccent.target);

  const ambientDeco = new THREE.PointLight(0x7ec9ff, 1.4, 20, 2);
  ambientDeco.position.set(0, 2.2, 14);
  scene.add(ambientDeco);

  const hud = root.querySelector(".immersive-hud");
  const startButton = root.querySelector('[data-action="start-immersive"]');
  const attributionPanel = document.createElement("p");
  attributionPanel.className = "immersive-attribution-panel";
  attributionPanel.setAttribute("aria-live", "polite");
  attributionPanel.textContent = "Apunta a un producto para ver su atribución";
  root.appendChild(attributionPanel);
  const focusRaycaster = new THREE.Raycaster();
  let lastFocusedAttribution = "";

  const findFocusedProduct = () => {
    focusRaycaster.setFromCamera({ x: 0, y: 0 }, camera);
    const hits = focusRaycaster.intersectObjects(shelfGroup.children, true);
    for (const hit of hits) {
      let node = hit.object;
      while (node) {
        if (node.userData?.productName) {
          return node.userData;
        }
        node = node.parent;
      }
    }
    return null;
  };

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

    const delta = Math.min(clock.getDelta(), 0.03);
    if (controls.isLocked) {
      const damping = 8.8 * delta;
      velocity.x -= velocity.x * damping;
      velocity.z -= velocity.z * damping;

      direction.z = Number(moveState.forward) - Number(moveState.backward);
      direction.x = Number(moveState.right) - Number(moveState.left);
      direction.normalize();

      const speed = moveState.sprint ? 2.0 : 1.0;

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

      const focusedProduct = findFocusedProduct();
      const attributionLabel = focusedProduct
        ? `${focusedProduct.productName}: ${focusedProduct.productAttribution}`
        : "Apunta a un producto para ver su atribución";
      if (attributionLabel !== lastFocusedAttribution) {
        attributionPanel.textContent = attributionLabel;
        lastFocusedAttribution = attributionLabel;
      }
    }

    renderer.render(scene, camera);
  };

  controls.addEventListener("lock", () => {
    root.classList.add("is-active");
    hud?.classList.add("is-hidden");
    attributionPanel.classList.add("is-visible");
  });

  controls.addEventListener("unlock", () => {
    root.classList.remove("is-active");
    hud?.classList.remove("is-hidden");
    attributionPanel.classList.remove("is-visible");
    attributionPanel.textContent = "Apunta a un producto para ver su atribución";
    lastFocusedAttribution = "";
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
  preloadProductModels()
    .catch(() => {
      // Mantener fallback procedural si falla alguna descarga.
    })
    .finally(() => {
      buildShelves();
      animate();
    });
}
