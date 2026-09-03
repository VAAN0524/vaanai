// 液态交互流体背景 —— 移植自 vgpu 官方 fluid 示例（压力投影 NS 求解器）
// 零依赖 vanilla WebGPU。品牌配色（青/紫），pointer 搅动 + 空闲双发射器。
// 无 WebGPU / prefers-reduced-motion 时静默跳过；hero 不可见或页面隐藏时暂停。
// 参考归档: ~/workspace/vgpu-examples/fluid/
/* eslint-disable */
const IDLE_A = [0.0, 0.85, 1.0];    // 品牌青
const IDLE_B = [0.42, 0.36, 0.91];  // 品牌紫

const COMMON = /* wgsl */ `
struct Grid { size: vec2u, dye_size: vec2u, }
struct Input {
  step: u32,
  pointer_active: f32,
  pointer_from: vec2f,
  pointer_to: vec2f,
  pointer_velocity: vec2f,
  pointer_color: vec4f,
  idle_a: vec4f,
  idle_b: vec4f,
}
fn index_of(p: vec2i, size: vec2u) -> u32 {
  let q = clamp(p, vec2i(0), vec2i(size) - 1);
  return u32(q.y) * size.x + u32(q.x);
}
fn cell_uv(p: vec2i, size: vec2u) -> vec2f {
  return (vec2f(p) + 0.5) / vec2f(size);
}
fn segment_weight(p: vec2f, a: vec2f, b: vec2f, radius_squared: f32, aspect: f32) -> f32 {
  let scale = vec2f(aspect, 1.0);
  let point = p * scale;
  let origin = a * scale;
  let delta = (b - a) * scale;
  let t = clamp(dot(point - origin, delta) / max(dot(delta, delta), 1e-7), 0.0, 1.0);
  let d = point - (origin + t * delta);
  return exp(-dot(d, d) / radius_squared);
}
fn emitter_weight(p: vec2f, emitter: vec4f, aspect: f32) -> f32 {
  let d = (p - emitter.xy) * vec2f(aspect, 1.0);
  return exp(-dot(d, d) / emitter.w) * emitter.z;
}
`;

const SHADERS = {
  advectVelocity: COMMON + /* wgsl */ `
  @group(0) @binding(0) var<uniform> grid: Grid;
  @group(0) @binding(1) var<uniform> input: Input;
  @group(0) @binding(2) var<storage, read> src: array<vec2f>;
  @group(0) @binding(3) var<storage, read_write> dst: array<vec2f>;
  fn sample_velocity(p: vec2f) -> vec2f {
    let coord = clamp(p * vec2f(grid.size) - 0.5, vec2f(0), vec2f(grid.size) - 1.0);
    let cell = vec2i(floor(coord));
    let f = fract(coord);
    let bottom = mix(src[index_of(cell, grid.size)], src[index_of(cell + vec2i(1, 0), grid.size)], f.x);
    let top = mix(src[index_of(cell + vec2i(0, 1), grid.size)], src[index_of(cell + vec2i(1, 1), grid.size)], f.x);
    return mix(bottom, top, f.y);
  }
  @compute @workgroup_size(8, 8)
  fn main(@builtin(global_invocation_id) id: vec3u) {
    if (any(id.xy >= grid.size)) { return; }
    let cell = vec2i(id.xy);
    let p = cell_uv(cell, grid.size);
    let aspect = f32(grid.size.x) / f32(grid.size.y);
    let dt = 1.0 / 60.0;
    let source_velocity = src[index_of(cell, grid.size)];
    let backtrace = clamp(p - dt * source_velocity, 0.5 / vec2f(grid.size), 1.0 - 0.5 / vec2f(grid.size));
    var velocity = 0.98 * sample_velocity(backtrace);
    let weight_a = emitter_weight(p, input.idle_a, aspect);
    let weight_b = emitter_weight(p, input.idle_b, aspect);
    let time = f32(input.step) / 60.0;
    let tangent_a = vec2f(0.28 * 0.73 * cos(0.73 * time), 0.22 * 1.09 * cos(1.09 * time + 0.4));
    let tangent_b = vec2f(0.26 * 0.61 * cos(0.61 * time + 3.14159265), 0.24 * 0.97 * cos(0.97 * time + 2.1));
    velocity += dt * (weight_a * (2.6 * tangent_a + 2.0 * vec2f(-tangent_a.y, tangent_a.x))
                    + weight_b * (2.6 * tangent_b - 2.0 * vec2f(-tangent_b.y, tangent_b.x)));
    if (input.pointer_active > 0.0) {
      let weight = segment_weight(p, input.pointer_from, input.pointer_to, 0.002, aspect);
      velocity += weight * input.pointer_velocity * 0.8;
    }
    let speed = length(velocity);
    if (speed > 2.5) { velocity *= 2.5 / speed; }
    dst[index_of(cell, grid.size)] = velocity;
  }`,
  curl: COMMON + /* wgsl */ `
  @group(0) @binding(0) var<uniform> grid: Grid;
  @group(0) @binding(1) var<storage, read> velocity: array<vec2f>;
  @group(0) @binding(2) var<storage, read_write> curl: array<f32>;
  @compute @workgroup_size(8, 8)
  fn main(@builtin(global_invocation_id) id: vec3u) {
    if (any(id.xy >= grid.size)) { return; }
    let p = vec2i(id.xy);
    let left = velocity[index_of(p - vec2i(1, 0), grid.size)].y;
    let right = velocity[index_of(p + vec2i(1, 0), grid.size)].y;
    let top = velocity[index_of(p + vec2i(0, 1), grid.size)].x;
    let bottom = velocity[index_of(p - vec2i(0, 1), grid.size)].x;
    curl[index_of(p, grid.size)] = 0.5 * (right - left - top + bottom);
  }`,
  vorticity: COMMON + /* wgsl */ `
  @group(0) @binding(0) var<uniform> grid: Grid;
  @group(0) @binding(1) var<storage, read> src: array<vec2f>;
  @group(0) @binding(2) var<storage, read> curl: array<f32>;
  @group(0) @binding(3) var<storage, read_write> dst: array<vec2f>;
  @compute @workgroup_size(8, 8)
  fn main(@builtin(global_invocation_id) id: vec3u) {
    if (any(id.xy >= grid.size)) { return; }
    let p = vec2i(id.xy);
    let left = abs(curl[index_of(p - vec2i(1, 0), grid.size)]);
    let right = abs(curl[index_of(p + vec2i(1, 0), grid.size)]);
    let top = abs(curl[index_of(p + vec2i(0, 1), grid.size)]);
    let bottom = abs(curl[index_of(p - vec2i(0, 1), grid.size)]);
    let center = curl[index_of(p, grid.size)];
    var force = 0.5 * vec2f(top - bottom, right - left);
    force /= length(force) + 0.0001;
    force *= 20.0 * center;
    force.y *= -1.0;
    var velocity = src[index_of(p, grid.size)] + force / 60.0;
    let speed = length(velocity);
    if (speed > 2.5) { velocity *= 2.5 / speed; }
    dst[index_of(p, grid.size)] = velocity;
  }`,
  divergence: COMMON + /* wgsl */ `
  @group(0) @binding(0) var<uniform> grid: Grid;
  @group(0) @binding(1) var<storage, read> velocity: array<vec2f>;
  @group(0) @binding(2) var<storage, read_write> divergence: array<f32>;
  @compute @workgroup_size(8, 8)
  fn main(@builtin(global_invocation_id) id: vec3u) {
    if (any(id.xy >= grid.size)) { return; }
    let p = vec2i(id.xy);
    let last = vec2i(grid.size) - 1;
    let l = select(velocity[index_of(p - vec2i(1, 0), grid.size)].x, 0.0, p.x == 0);
    let r = select(velocity[index_of(p + vec2i(1, 0), grid.size)].x, 0.0, p.x == last.x);
    let b = select(velocity[index_of(p - vec2i(0, 1), grid.size)].y, 0.0, p.y == 0);
    let t = select(velocity[index_of(p + vec2i(0, 1), grid.size)].y, 0.0, p.y == last.y);
    divergence[index_of(p, grid.size)] = (r - l)*.5*f32(grid.size.x) + (t - b)*.5*f32(grid.size.y);
  }`,
  pressure: COMMON + /* wgsl */ `
  struct PressureParams { decay: f32, }
  @group(0) @binding(0) var<uniform> grid: Grid;
  @group(0) @binding(1) var<uniform> params: PressureParams;
  @group(0) @binding(2) var<storage, read> src: array<f32>;
  @group(0) @binding(3) var<storage, read> divergence: array<f32>;
  @group(0) @binding(4) var<storage, read_write> dst: array<f32>;
  @compute @workgroup_size(8, 8)
  fn main(@builtin(global_invocation_id) id: vec3u) {
    if (any(id.xy >= grid.size)) { return; }
    let p = vec2i(id.xy);
    let i = index_of(p, grid.size);
    let center = src[i];
    let last = vec2i(grid.size) - 1;
    let left = select(src[index_of(p - vec2i(1, 0), grid.size)], center, p.x == 0) * params.decay;
    let right = select(src[index_of(p + vec2i(1, 0), grid.size)], center, p.x == last.x) * params.decay;
    let bottom = select(src[index_of(p - vec2i(0, 1), grid.size)], center, p.y == 0) * params.decay;
    let top = select(src[index_of(p + vec2i(0, 1), grid.size)], center, p.y == last.y) * params.decay;
    let wx = f32(grid.size.x * grid.size.x);
    let wy = f32(grid.size.y * grid.size.y);
    dst[i] = ((left + right) * wx + (bottom + top) * wy - divergence[i]) / (2.0 * wx + 2.0 * wy);
  }`,
  project: COMMON + /* wgsl */ `
  @group(0) @binding(0) var<uniform> grid: Grid;
  @group(0) @binding(1) var<storage, read> src: array<vec2f>;
  @group(0) @binding(2) var<storage, read> pressure: array<f32>;
  @group(0) @binding(3) var<storage, read_write> dst: array<vec2f>;
  @compute @workgroup_size(8, 8)
  fn main(@builtin(global_invocation_id) id: vec3u) {
    if (any(id.xy >= grid.size)) { return; }
    let p = vec2i(id.xy);
    let last = vec2i(grid.size) - 1;
    let c = pressure[index_of(p, grid.size)];
    let l = select(pressure[index_of(p - vec2i(1, 0), grid.size)], c, p.x == 0);
    let r = select(pressure[index_of(p + vec2i(1, 0), grid.size)], c, p.x == last.x);
    let b = select(pressure[index_of(p - vec2i(0, 1), grid.size)], c, p.y == 0);
    let t = select(pressure[index_of(p + vec2i(0, 1), grid.size)], c, p.y == last.y);
    var u = src[index_of(p, grid.size)] - vec2f((r - l)*.5*f32(grid.size.x), (t - b)*.5*f32(grid.size.y));
    if (p.x == 0 && u.x < 0.0) { u.x = 0.0; }
    if (p.x == last.x && u.x > 0.0) { u.x = 0.0; }
    if (p.y == 0 && u.y < 0.0) { u.y = 0.0; }
    if (p.y == last.y && u.y > 0.0) { u.y = 0.0; }
    let s = length(u);
    if (s > 2.5) { u *= 2.5 / s; }
    dst[index_of(p, grid.size)] = u;
  }`,
  advectDye: COMMON + /* wgsl */ `
  @group(0) @binding(0) var<uniform> grid: Grid;
  @group(0) @binding(1) var<uniform> input: Input;
  @group(0) @binding(2) var<storage, read> src: array<vec4f>;
  @group(0) @binding(3) var<storage, read> velocity: array<vec2f>;
  @group(0) @binding(4) var<storage, read_write> dst: array<vec4f>;
  fn sample_dye(p: vec2f) -> vec4f {
    let coord = clamp(p * vec2f(grid.dye_size) - 0.5, vec2f(0), vec2f(grid.dye_size) - 1.0);
    let cell = vec2i(floor(coord));
    let f = fract(coord);
    let bottom = mix(src[index_of(cell, grid.dye_size)], src[index_of(cell + vec2i(1, 0), grid.dye_size)], f.x);
    let top = mix(src[index_of(cell + vec2i(0, 1), grid.dye_size)], src[index_of(cell + vec2i(1, 1), grid.dye_size)], f.x);
    return mix(bottom, top, f.y);
  }
  fn sample_velocity(p: vec2f) -> vec2f {
    let coord = clamp(p * vec2f(grid.size) - 0.5, vec2f(0), vec2f(grid.size) - 1.0);
    let cell = vec2i(floor(coord));
    let f = fract(coord);
    let bottom = mix(velocity[index_of(cell, grid.size)], velocity[index_of(cell + vec2i(1, 0), grid.size)], f.x);
    let top = mix(velocity[index_of(cell + vec2i(0, 1), grid.size)], velocity[index_of(cell + vec2i(1, 1), grid.size)], f.x);
    return mix(bottom, top, f.y);
  }
  @compute @workgroup_size(8, 8)
  fn main(@builtin(global_invocation_id) id: vec3u) {
    if (any(id.xy >= grid.dye_size)) { return; }
    let cell = vec2i(id.xy);
    let p = cell_uv(cell, grid.dye_size);
    let aspect = f32(grid.size.x) / f32(grid.size.y);
    let backtrace = clamp(p - sample_velocity(p) / 60.0, 0.5 / vec2f(grid.dye_size), 1.0 - 0.5 / vec2f(grid.dye_size));
    var color = 0.97 * sample_dye(backtrace);
    color += vec4f(${IDLE_A[0]}, ${IDLE_A[1]}, ${IDLE_A[2]}, 1.0) * emitter_weight(p, input.idle_a, aspect) * 0.10;
    color += vec4f(${IDLE_B[0]}, ${IDLE_B[1]}, ${IDLE_B[2]}, 1.0) * emitter_weight(p, input.idle_b, aspect) * 0.10;
    if (input.pointer_active > 0.0) {
      let weight = segment_weight(p, input.pointer_from, input.pointer_to, 0.002, aspect);
      color += input.pointer_color * weight * 0.30;
    }
    dst[index_of(cell, grid.dye_size)] = clamp(color, vec4f(0), vec4f(4));
  }`,
  display: /* wgsl */ `
  struct DisplayConfig { output_size: vec2f, }
  const DYE_SIZE = vec2u(512, 288);
  @group(0) @binding(0) var<uniform> config: DisplayConfig;
  @group(0) @binding(1) var<storage, read> dye: array<vec4f>;
  fn index_of(p: vec2i, size: vec2u) -> u32 {
    let q = clamp(p, vec2i(0), vec2i(size) - 1);
    return u32(q.y) * size.x + u32(q.x);
  }
  fn sample_dye(p: vec2f) -> vec3f {
    let grid = clamp(p * vec2f(DYE_SIZE) - 0.5, vec2f(0), vec2f(DYE_SIZE) - 1.0);
    let cell = vec2i(floor(grid));
    let f = fract(grid);
    let bottom = mix(dye[index_of(cell, DYE_SIZE)].rgb, dye[index_of(cell + vec2i(1, 0), DYE_SIZE)].rgb, f.x);
    let top = mix(dye[index_of(cell + vec2i(0, 1), DYE_SIZE)].rgb, dye[index_of(cell + vec2i(1, 1), DYE_SIZE)].rgb, f.x);
    return mix(bottom, top, f.y);
  }
  @vertex fn vertex_main(@builtin(vertex_index) vi: u32) -> @builtin(position) vec4f {
    let x = f32(i32(vi >> 1u) - 1);
    let y = f32(i32(vi & 1u) * 4 - 1);
    return vec4f(x, y, 0.0, 1.0);
  }
  @fragment fn fragment_main(@builtin(position) position: vec4f) -> @location(0) vec4f {
    var uv = position.xy / config.output_size;
    uv.y = 1.0 - uv.y;
    let density = sample_dye(uv);
    let color = 1.0 - exp(-density * 1.25);
    let vignette = 0.72 + 0.28 * pow(max(0.0, 1.0 - dot(uv - 0.5, uv - 0.5) * 1.9), 1.5);
    let glow = color * vignette;
    let lum = max(glow.r, max(glow.g, glow.b));
    let alpha = clamp(lum * 1.7, 0.0, 0.82);
    return vec4f(glow * alpha, alpha);
  }`,
};

const GRID = [128, 72];
const DYE = [512, 288];
const CELLS = GRID[0] * GRID[1];
const DYE_CELLS = DYE[0] * DYE[1];
const FIXED_STEP = 1 / 60;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

export async function createFluidLayer(heroEl, canvas) {
  if (!navigator.gpu) throw new Error("no webgpu");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) throw new Error("reduced motion");
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error("no adapter");
  const device = await adapter.requestDevice();
  device.addEventListener?.("uncapturederror", (e) => console.warn("[fluid]", e.error?.message));

  const ctx = canvas.getContext("webgpu");
  const format = navigator.gpu.getPreferredCanvasFormat();
  ctx.configure({ device, format, alphaMode: "premultiplied" });

  // ── storage buffers ──
  const mk = (bytes) => device.createBuffer({ size: bytes, usage: GPUBufferUsage.STORAGE });
  const vel = [mk(CELLS * 8), mk(CELLS * 8)];
  const dye = [mk(DYE_CELLS * 16), mk(DYE_CELLS * 16)];
  const pres = [mk(CELLS * 4), mk(CELLS * 4)];
  const div = mk(CELLS * 4);
  const curlBuf = mk(CELLS * 4);

  // ── uniform buffers（每个 WGSL uniform 变量独立 buffer，避开 256 对齐偏移）──
  const U = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
  const bufGrid = device.createBuffer({ size: 16, usage: U });
  const bufInput = device.createBuffer({ size: 96, usage: U });
  const bufParams = device.createBuffer({ size: 16, usage: U });
  const bufDisplay = device.createBuffer({ size: 16, usage: U });

  const gridU32 = new Uint32Array([GRID[0], GRID[1], DYE[0], DYE[1]]);
  device.queue.writeBuffer(bufGrid, 0, gridU32);
  device.queue.writeBuffer(bufDisplay, 0, new Float32Array([canvas.width || 8, canvas.height || 8, 0, 0]));

  // ── pipelines ──
  const computePipe = (code) => device.createComputePipeline({ layout: "auto", compute: { module: device.createShaderModule({ code }), entryPoint: "main" } });
  const pAdvV = computePipe(SHADERS.advectVelocity);
  const pCurl = computePipe(SHADERS.curl);
  const pVort = computePipe(SHADERS.vorticity);
  const pDiv = computePipe(SHADERS.divergence);
  const pPres = computePipe(SHADERS.pressure);
  const pProj = computePipe(SHADERS.project);
  const pAdvD = computePipe(SHADERS.advectDye);
  const renderModule = device.createShaderModule({ code: SHADERS.display });
  const pDisplay = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: renderModule, entryPoint: "vertex_main" },
    fragment: { module: renderModule, entryPoint: "fragment_main", targets: [{ format }] },
    primitive: { topology: "triangle-list" },
  });

  const bg = (pipeline, entries) => device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries });
  const B = (i, buf) => ({ binding: i, resource: { buffer: buf } });

  // bind group 每帧内联创建（与官方一致）：ping-pong 不同步的缓冲若预建会读错帧
  let velIdx = 0, dyeIdx = 0, presIdx = 0;

  // ── input uniform（偏移与 WGSL Input 布局严格对应）──
  const scratch = new ArrayBuffer(80);
  const sU32 = new Uint32Array(scratch);
  const sF32 = new Float32Array(scratch);
  const input = { active: false, from: [0.5, 0.5], to: [0.5, 0.5], velocity: [0, 0], color: [0.4, 0.8, 1.0, 1.0] };
  let lastInputStep = -1000;

  function writeInputUniform(step) {
    sU32[0] = step;
    sF32[1] = input.active ? 1 : 0;
    sF32[2] = input.from[0]; sF32[3] = input.from[1];
    sF32[4] = input.to[0];   sF32[5] = input.to[1];
    sF32[6] = input.velocity[0]; sF32[7] = input.velocity[1];
    sF32[8] = input.color[0]; sF32[9] = input.color[1]; sF32[10] = input.color[2]; sF32[11] = input.color[3];
    const [a, b] = idleEmitters(step);
    sF32[12] = a[0]; sF32[13] = a[1]; sF32[14] = idleStrength(step); sF32[15] = 0.006;
    sF32[16] = b[0]; sF32[17] = b[1]; sF32[18] = idleStrength(step) * 0.92; sF32[19] = 0.0055;
    device.queue.writeBuffer(bufInput, 0, scratch);
  }
  function idleEmitters(step) {
    const t = step / 60;
    return [
      [0.5 + 0.28 * Math.sin(0.73 * t), 0.5 + 0.22 * Math.sin(1.09 * t + 0.4)],
      [0.5 + 0.26 * Math.sin(0.61 * t + Math.PI), 0.5 + 0.24 * Math.sin(0.97 * t + 2.1)],
    ];
  }
  function idleStrength(step) {
    const since = step - lastInputStep;
    const idle = since < 90 ? 0.15 : 0.15 + 0.85 * Math.min(1, (since - 90) / 60);
    return Math.min(1, (step + 1) / 24) * idle;
  }

  // ── 单步求解（在调用方的 compute pass 中按序 dispatch）──
  function stepFluid(step, command) {
    if (input.active) lastInputStep = step;
    writeInputUniform(step);
    const disp = (pipe, entries, x, y) => {
      command.setPipeline(pipe);
      command.setBindGroup(0, bg(pipe, entries));
      command.dispatchWorkgroups(x, y);
    };
    disp(pAdvV, [B(0, bufGrid), B(1, bufInput), B(2, vel[velIdx]), B(3, vel[1 - velIdx])], 16, 9);
    velIdx = 1 - velIdx;
    disp(pCurl, [B(0, bufGrid), B(1, vel[velIdx]), B(2, curlBuf)], 16, 9);
    disp(pVort, [B(0, bufGrid), B(1, vel[velIdx]), B(2, curlBuf), B(3, vel[1 - velIdx])], 16, 9);
    velIdx = 1 - velIdx;
    disp(pDiv, [B(0, bufGrid), B(1, vel[velIdx]), B(2, div)], 16, 9);
    for (let i = 0; i < 3; i++) {
      device.queue.writeBuffer(bufParams, 0, new Float32Array([i === 0 ? 0.8 : 1]));
      disp(pPres, [B(0, bufGrid), B(1, bufParams), B(2, pres[presIdx]), B(3, div), B(4, pres[1 - presIdx])], 16, 9);
      presIdx = 1 - presIdx;
    }
    // 压力 3 轮后最新结果在 pres[presIdx]
    disp(pProj, [B(0, bufGrid), B(1, vel[velIdx]), B(2, pres[presIdx]), B(3, vel[1 - velIdx])], 16, 9);
    velIdx = 1 - velIdx;
    disp(pAdvD, [B(0, bufGrid), B(1, bufInput), B(2, dye[dyeIdx]), B(3, vel[velIdx]), B(4, dye[1 - dyeIdx])], 64, 36);
    dyeIdx = 1 - dyeIdx;
  }

  // ── sizing ──
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(2, Math.floor(heroEl.clientWidth * dpr));
    const h = Math.max(2, Math.floor(heroEl.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      ctx.configure({ device, format, alphaMode: "premultiplied" });
    }
    device.queue.writeBuffer(bufDisplay, 0, new Float32Array([canvas.width, canvas.height, 0, 0]));
  }
  resize();
  window.addEventListener("resize", resize);

  // ── pointer 搅动（hero 内 hover 即可搅动，无需按下）──
  let lastT = 0;
  const point = (e) => {
    const r = heroEl.getBoundingClientRect();
    return [
      clamp01((e.clientX - r.left) / Math.max(1, r.width)),
      clamp01(1 - (e.clientY - r.top) / Math.max(1, r.height)),
    ];
  };
  heroEl.addEventListener("pointermove", (e) => {
    const next = point(e);
    const dt = lastT ? Math.max(0.004, (e.timeStamp - lastT) / 1000) : 0.016;
    const v = [(next[0] - input.to[0]) / dt, (next[1] - input.to[1]) / dt];
    input.from = input.to;
    input.to = next;
    input.velocity = [clamp(v[0], -3, 3), clamp(v[1], -3, 3)];
    const speed = Math.hypot(...input.velocity) || 1e-4;
    const dx = input.velocity[0] / speed, dy = input.velocity[1] / speed;
    // 运动方向决定染料色相：水平→青，垂直→紫粉（品牌色域内）
    input.color = [0.15 + 0.45 * Math.abs(dx), 0.55 + 0.35 * Math.abs(dy), 1.0, 1.0];
    input.active = true;
    lastT = e.timeStamp;
  });
  heroEl.addEventListener("pointerleave", () => { input.active = false; });

  // ── 主循环 ──
  let visible = true, running = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(heroEl);
  window.addEventListener("vaanai:pause-animations", () => { running = false; });
  window.addEventListener("vaanai:resume-animations", () => { running = true; });

  let accumulator = 0, previous = performance.now(), stepCount = 0;
  function tick(now) {
    if (!running) { previous = now; requestAnimationFrame(tick); return; }
    const elapsed = Math.min((now - previous) / 1000, 1 / 30);
    previous = now;
    if (visible && !document.hidden) {
      accumulator += elapsed;
      let steps = 0;
      const encoder = device.createCommandEncoder();
      const cpass = encoder.beginComputePass();
      const command = {
        setPipeline: (p) => cpass.setPipeline(p),
        setBindGroup: (i, g) => cpass.setBindGroup(i, g),
        dispatchWorkgroups: (x, y) => cpass.dispatchWorkgroups(x, y),
      };
      while (accumulator >= FIXED_STEP && steps < 2) {
        accumulator -= FIXED_STEP; steps++; stepCount++;
        stepFluid(stepCount, command);
      }
      cpass.end();
      if (steps > 0) {
        const displayBG = bg(pDisplay, [B(bufDisplay), B(dye[1 - dyeIdx])]);
        const pass = encoder.beginRenderPass({
          colorAttachments: [{
            view: ctx.getCurrentTexture().createView(),
            clearValue: { r: 0, g: 0, b: 0, a: 0 },
            loadOp: "clear", storeOp: "store",
          }],
        });
        pass.setPipeline(pDisplay);
        pass.setBindGroup(0, displayBG);
        pass.draw(3);
        pass.end();
      }
      device.queue.submit([encoder.finish()]);
      input.active = false;   // pointermove 事件驱动，无事件即停
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  return { dispose() { try { device.destroy(); } catch (_) {} } };
}

// ── 入口 ──
document.addEventListener("DOMContentLoaded", () => {
  const hero = document.getElementById("hero");
  const canvas = document.getElementById("fluidCanvas");
  if (!hero || !canvas) return;
  import.meta.url; // ESM 标记
  createFluidLayer(hero, canvas).catch((err) => {
    console.info("[fluid] WebGPU 不可用，使用默认背景:", err?.message || err);
    canvas.remove();
  });
});
