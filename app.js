const SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const TX_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const RX_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
const WECHAT_ID = "jsjnsbsj7372992bs";

const state = {
  connected: false,
  scanning: false,
  device: null,
  server: null,
  service: null,
  txChar: null,
  rxChar: null,
  rawBuffer: null,
  rawPacket3D: null,
  receivedChunks: new Set(),
  isProcessing: false,
  values: {
    servoAngle: 220,
    servoNeutral: 0,
    dampingFactor: 50,
    pwmPowerRaw: 227,
    sensitivityLevel: 1,
    softStart: false,
    servoName: "--",
    manufactureDate: "--"
  }
};

const el = {
  statusDot: document.getElementById("statusDot"),
  statusText: document.getElementById("statusText"),
  connectBtn: document.getElementById("connectBtn"),
  devicePanel: document.getElementById("devicePanel"),
  deviceHintPanel: document.getElementById("deviceHintPanel"),
  deviceIdText: document.getElementById("deviceIdText"),
  copyIdBtn: document.getElementById("copyIdBtn"),
  infoText: document.getElementById("infoText"),
  adapterPluginText: document.getElementById("adapterPluginText"),
  servoPluginText: document.getElementById("servoPluginText"),
  buyModuleBtn: document.getElementById("buyModuleBtn"),
  copyFeedbackBtn: document.getElementById("copyFeedbackBtn"),
  contactBtn: document.getElementById("contactBtn"),
  readBtn: document.getElementById("readBtn"),
  writeBtn: document.getElementById("writeBtn"),
  defaultBtn: document.getElementById("defaultBtn"),
  softStartToggle: document.getElementById("softStartToggle"),
  softStartCheckbox: document.getElementById("softStartCheckbox"),
  servoAngle: document.getElementById("servoAngle"),
  servoNeutral: document.getElementById("servoNeutral"),
  dampingFactor: document.getElementById("dampingFactor"),
  pwmPowerRaw: document.getElementById("pwmPowerRaw"),
  sensitivityLevel: document.getElementById("sensitivityLevel"),
  servoAngleValue: document.getElementById("servoAngleValue"),
  servoNeutralValue: document.getElementById("servoNeutralValue"),
  dampingFactorValue: document.getElementById("dampingFactorValue"),
  pwmPowerDisplayValue: document.getElementById("pwmPowerDisplayValue"),
  sensitivityLevelValue: document.getElementById("sensitivityLevelValue"),
  servoNameValue: document.getElementById("servoNameValue"),
  manufactureDateValue: document.getElementById("manufactureDateValue"),
  adSwiper: document.getElementById("adSwiper"),
  adDots: Array.from(document.querySelectorAll(".ad-dot")),
  dialog: document.getElementById("messageDialog"),
  dialogTitle: document.getElementById("dialogTitle"),
  dialogContent: document.getElementById("dialogContent"),
  dialogActions: document.getElementById("dialogActions")
};

const sliderFields = ["servoAngle", "servoNeutral", "dampingFactor", "pwmPowerRaw", "sensitivityLevel"];

function sensitivityText(value) {
  if (value === 1) return "Ultra High";
  if (value === 2) return "High";
  if (value === 3) return "Medium";
  return "Low";
}

function pwmDisplay(raw) {
  return `${(raw * 100 / 255).toFixed(1)} %`;
}

function updateFieldValue(field, value) {
  state.values[field] = value;
  if (sliderFields.includes(field)) {
    el[field].value = value;
  }

  if (field === "servoAngle") el.servoAngleValue.textContent = value;
  if (field === "servoNeutral") el.servoNeutralValue.textContent = value;
  if (field === "dampingFactor") el.dampingFactorValue.textContent = value;
  if (field === "pwmPowerRaw") el.pwmPowerDisplayValue.textContent = pwmDisplay(value);
  if (field === "sensitivityLevel") el.sensitivityLevelValue.textContent = sensitivityText(value);
  if (field === "servoName") el.servoNameValue.textContent = value || "--";
  if (field === "manufactureDate") el.manufactureDateValue.textContent = value || "--";
  if (field === "softStart") el.softStartCheckbox.classList.toggle("checked", Boolean(value));
}

function renderValues() {
  updateFieldValue("servoAngle", state.values.servoAngle);
  updateFieldValue("servoNeutral", state.values.servoNeutral);
  updateFieldValue("dampingFactor", state.values.dampingFactor);
  updateFieldValue("pwmPowerRaw", state.values.pwmPowerRaw);
  updateFieldValue("sensitivityLevel", state.values.sensitivityLevel);
  updateFieldValue("servoName", state.values.servoName);
  updateFieldValue("manufactureDate", state.values.manufactureDate);
  updateFieldValue("softStart", state.values.softStart);
}

function setStatus(text, connected = state.connected) {
  el.statusText.textContent = text;
  el.statusDot.classList.toggle("connected", connected);
}

function setAdapterText(text) {
  el.adapterPluginText.textContent = text;
}

function setServoText(text) {
  el.servoPluginText.textContent = text;
}

function setBusy(isBusy) {
  state.isProcessing = isBusy;
  const disabled = isBusy;
  document.querySelectorAll(".icon-btn").forEach((button) => {
    button.disabled = disabled;
  });
  sliderFields.forEach((field) => {
    el[field].disabled = disabled;
  });
  el.softStartToggle.disabled = disabled;
  el.readBtn.disabled = disabled || !state.connected;
  el.writeBtn.disabled = disabled || !state.connected;
  el.defaultBtn.disabled = disabled || !state.connected;
}

function refreshConnectionUi() {
  el.devicePanel.classList.toggle("hidden", !state.connected || !state.device);
  el.deviceHintPanel.classList.toggle("hidden", !state.scanning);
  if (state.device) {
    el.deviceIdText.textContent = `Device ID: ${state.device.id}`;
  }

  if (state.connected) {
    el.connectBtn.textContent = "断开设备";
    el.connectBtn.classList.add("disconnect");
  } else {
    el.connectBtn.textContent = "扫描连接";
    el.connectBtn.classList.remove("disconnect");
  }

  setBusy(state.isProcessing);
}

function showDialog({ title, content, actions }) {
  el.dialogTitle.textContent = title;
  el.dialogContent.textContent = content;
  el.dialogActions.innerHTML = "";

  actions.forEach((action) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `modal-btn${action.primary ? " primary" : ""}`;
    btn.textContent = action.label;
    btn.addEventListener("click", () => {
      el.dialog.close();
      if (action.onClick) action.onClick();
    });
    el.dialogActions.appendChild(btn);
  });

  if (!el.dialog.open) el.dialog.showModal();
}

function showAlert(title, content) {
  showDialog({
    title,
    content,
    actions: [{ label: "知道了", primary: true }]
  });
}

function showConfirm(title, content, onConfirm) {
  showDialog({
    title,
    content,
    actions: [
      { label: "取消" },
      { label: "确定", primary: true, onClick: onConfirm }
    ]
  });
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showAlert("已复制", successMessage);
  } catch (error) {
    showAlert("复制失败", `浏览器未允许写入剪贴板。\n\n${error.message}`);
  }
}

function resetRawPacketCache() {
  state.rawBuffer = null;
  state.rawPacket3D = null;
  state.receivedChunks = new Set();
}

function handleStatusCode(code) {
  const statusMap = {
    0: { text: "舵机掉线", plugin: "Servo disconnected", loading: false, toast: "舵机连接丢失" },
    1: { text: "舵机就绪", plugin: "Servo plug-in!", loading: false, toast: "舵机已连接" },
    2: { text: "读取成功", plugin: "Servo plug-in!", loading: false, toast: "读取成功" },
    3: { text: "写入成功", plugin: "Servo plug-in!", loading: false, toast: "写入成功" },
    4: { text: "拒绝盲写", plugin: "Servo plug-in!", loading: false, toast: "请先读取参数！" },
    5: { text: "正在读取...", plugin: "Servo plug-in!", loading: true },
    6: { text: "读取失败", plugin: "Servo disconnected", loading: false, toast: "读取失败，请检查连线" },
    7: { text: "正在写入...", plugin: "Servo plug-in!", loading: true },
    8: { text: "正在重置...", plugin: "Servo plug-in!", loading: true }
  };

  const status = statusMap[code];
  if (!status) return;

  setStatus(status.text, state.connected);
  setServoText(status.plugin);
  setBusy(status.loading);

  if (code === 5) resetRawPacketCache();
  if (!status.loading && status.toast) {
    showAlert(status.text, status.toast);
  }
}

function parseNotifyPacket(bytes) {
  if (!bytes.length) return;
  const cmd = bytes[0];

  if (cmd === 0x81 && bytes.length >= 11) {
    const angle = bytes[1];
    const neutral = bytes[2] - 128;
    const damping = (bytes[3] << 8) | bytes[4];
    const pwmRaw = bytes[5];
    const sensitivity = bytes[6];
    const soft = bytes[7] > 0;
    const day = bytes[8];
    const month = bytes[9];
    const year = bytes[10];

    updateFieldValue("servoAngle", angle);
    updateFieldValue("servoNeutral", neutral);
    updateFieldValue("dampingFactor", damping);
    updateFieldValue("pwmPowerRaw", pwmRaw);
    updateFieldValue("sensitivityLevel", sensitivity);
    updateFieldValue("softStart", soft);
    updateFieldValue("manufactureDate", `20${year}/${month}/${day}`);
  } else if (cmd === 0x82 && bytes.length >= 2) {
    let name = "";
    for (let i = 1; i < bytes.length && bytes[i] !== 0; i += 1) {
      name += String.fromCharCode(bytes[i]);
    }
    if (name) updateFieldValue("servoName", name);
  } else if (cmd === 0x83 && bytes.length >= 2) {
    handleStatusCode(bytes[1]);
  } else if (cmd === 0x84 && bytes.length >= 4) {
    const chunkIdx = bytes[1];
    const totalChunks = bytes[2];
    const totalLen = bytes[3];
    const payload = bytes.slice(4);
    const maxPayload = 13;
    const startIdx = chunkIdx * maxPayload;

    if (!state.rawBuffer || state.rawBuffer.length !== totalLen) {
      state.rawBuffer = new Uint8Array(totalLen);
      state.receivedChunks = new Set();
    }

    state.rawBuffer.set(payload, startIdx);
    state.receivedChunks.add(chunkIdx);

    if (state.receivedChunks.size === totalChunks) {
      state.rawPacket3D = state.rawBuffer.slice();
    }
  }
}

async function sendCommand(data) {
  if (!state.connected || !state.txChar) {
    throw new Error("设备未连接");
  }

  const buffer = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (typeof state.txChar.writeValueWithoutResponse === "function") {
    await state.txChar.writeValueWithoutResponse(buffer);
  } else {
    await state.txChar.writeValue(buffer);
  }
}

function onDisconnected() {
  state.connected = false;
  state.server = null;
  state.service = null;
  state.txChar = null;
  state.rxChar = null;
  state.isProcessing = false;
  setStatus("已断开", false);
  setAdapterText("Adapter disconnected");
  setServoText("Servo disconnected");
  refreshConnectionUi();
}

async function connectBleDevice() {
  if (!navigator.bluetooth) {
    showAlert("浏览器不支持", "当前浏览器不支持 Web Bluetooth。\n\n请使用最新版 Chrome 或 Edge，并通过 localhost 或 https 打开本页面。");
    return;
  }

  try {
    state.scanning = true;
    setStatus("初始化蓝牙...", false);
    setAdapterText("Adapter ready");
    setServoText("Waiting for servo...");
    refreshConnectionUi();

    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { namePrefix: "AFRC" },
        { namePrefix: "Servo" }
      ],
      optionalServices: [SERVICE_UUID]
    });

    state.device = device;
    state.device.addEventListener("gattserverdisconnected", onDisconnected);
    setStatus("正在连接...", false);

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    const txChar = await service.getCharacteristic(TX_UUID);
    const rxChar = await service.getCharacteristic(RX_UUID);

    await rxChar.startNotifications();
    rxChar.addEventListener("characteristicvaluechanged", (event) => {
      const view = event.target.value;
      parseNotifyPacket(new Uint8Array(view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength)));
    });

    state.server = server;
    state.service = service;
    state.txChar = txChar;
    state.rxChar = rxChar;
    state.connected = true;
    state.scanning = false;

    setStatus("设备就绪", true);
    setAdapterText("Adapter ready");
    setServoText("Waiting for servo...");
    refreshConnectionUi();

    await readParams();
  } catch (error) {
    state.scanning = false;
    if (error.name === "NotFoundError") {
      setStatus("未选择设备", false);
    } else {
      setStatus("连接失败", false);
      showAlert("连接失败", error.message || String(error));
    }
    refreshConnectionUi();
  }
}

async function disconnectBleDevice() {
  try {
    if (state.device?.gatt?.connected) {
      state.device.gatt.disconnect();
    } else {
      onDisconnected();
    }
  } catch (error) {
    showAlert("断开失败", error.message || String(error));
  }
}

async function readParams() {
  if (!state.connected) {
    showAlert("未连接", "请先连接设备。");
    return;
  }
  await sendCommand([0x01]);
}

async function defaultParams() {
  if (!state.connected) {
    showAlert("未连接", "请先连接设备。");
    return;
  }

  showConfirm("确认", "确定要恢复出厂默认设置吗？舵机将短暂重启。", async () => {
    try {
      await sendCommand([0x03]);
    } catch (error) {
      showAlert("发送失败", error.message || String(error));
    }
  });
}

async function writeParams() {
  if (!state.connected) {
    showAlert("未连接", "请先连接设备。");
    return;
  }

  const damping = state.values.dampingFactor;
  const payload = new Uint8Array([
    0x02,
    state.values.servoAngle & 0xff,
    (state.values.servoNeutral + 128) & 0xff,
    (damping >> 8) & 0xff,
    damping & 0xff,
    state.values.pwmPowerRaw & 0xff,
    state.values.sensitivityLevel & 0xff,
    state.values.softStart ? 1 : 0
  ]);

  try {
    await sendCommand(payload);
  } catch (error) {
    showAlert("发送失败", error.message || String(error));
  }
}

function buildFeedbackPayload() {
  const feedbackData = {
    servoName: state.values.servoName,
    manufactureDate: state.values.manufactureDate,
    servoAngle: state.values.servoAngle,
    servoNeutral: state.values.servoNeutral,
    dampingFactor: state.values.dampingFactor,
    pwmPowerRaw: state.values.pwmPowerRaw,
    sensitivityLevel: state.values.sensitivityLevel,
    softStart: state.values.softStart
  };

  let content = JSON.stringify(feedbackData, null, 2);
  const targetData = state.rawPacket3D || state.rawBuffer;

  if (targetData && targetData.length > 0) {
    const encrypted = new Uint8Array(targetData.length);
    for (let i = 0; i < targetData.length; i += 1) {
      encrypted[i] = targetData[i] ^ 0xa5;
    }
    const base64 = btoa(String.fromCharCode(...encrypted));
    content = `AFRC-RAW-DATA:${base64}\n\n${content}`;
  }

  return content;
}

function bindUiEvents() {
  el.connectBtn.addEventListener("click", async () => {
    if (state.connected) {
      await disconnectBleDevice();
    } else {
      await connectBleDevice();
    }
  });

  el.copyIdBtn.addEventListener("click", async () => {
    if (!state.device) return;
    await copyText(state.device.id, "设备 ID 已复制");
  });

  el.copyFeedbackBtn.addEventListener("click", async () => {
    if (!state.connected) {
      showAlert("请先连接", "请先连接设备并读取参数。");
      return;
    }
    await copyText(buildFeedbackPayload(), "数据包反馈已复制");
  });

  el.contactBtn.addEventListener("click", async () => {
    await copyText(WECHAT_ID, "客服微信已复制");
  });

  el.buyModuleBtn.addEventListener("click", async () => {
    await copyText(WECHAT_ID, "客服微信已复制，可直接粘贴联系");
  });

  el.readBtn.addEventListener("click", async () => {
    try {
      await readParams();
    } catch (error) {
      showAlert("读取失败", error.message || String(error));
    }
  });

  el.writeBtn.addEventListener("click", async () => {
    await writeParams();
  });

  el.defaultBtn.addEventListener("click", async () => {
    await defaultParams();
  });

  sliderFields.forEach((field) => {
    el[field].addEventListener("input", (event) => {
      updateFieldValue(field, Number(event.target.value));
    });
  });

  document.querySelectorAll(".icon-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const field = button.dataset.field;
      const step = Number(button.dataset.step);
      const min = Number(button.dataset.min);
      const max = Number(button.dataset.max);
      const current = Number(state.values[field]);
      const next = Math.min(max, Math.max(min, current + step));
      updateFieldValue(field, next);
    });
  });

  el.softStartToggle.addEventListener("click", () => {
    updateFieldValue("softStart", !state.values.softStart);
  });
}

function startAdRotation() {
  const slides = Array.from(el.adSwiper.querySelectorAll(".ad-slide"));
  let index = 0;

  window.setInterval(() => {
    slides[index].classList.remove("is-active");
    el.adDots[index].classList.remove("is-active");
    index = (index + 1) % slides.length;
    slides[index].classList.add("is-active");
    el.adDots[index].classList.add("is-active");
  }, 3200);
}

function init() {
  renderValues();
  setStatus("未连接", false);
  setAdapterText("Adapter disconnected");
  setServoText("Servo disconnected");
  bindUiEvents();
  refreshConnectionUi();
  startAdRotation();
}

init();
