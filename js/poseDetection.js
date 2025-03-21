// js/poseDetection.js

const MIN_ANGLE_DIFF = 0.3;
const PEAK_DROP_RATIO = 0.8;
const COOLDOWN_TIME = 300;
const BASELINE_WINDOW_SIZE = 30;

const connections = [
  ['nose', 'left_eye'], ['nose', 'right_eye'], ['left_eye', 'left_ear'],
  ['right_eye', 'right_ear'], ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
  ['left_hip', 'right_hip'], ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'], ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle']
];

export class FootState {
  constructor() {
    this.state = 'waiting';
    this.baselineDiff = null;
    this.baselineWindow = [];
    this.maxDiff = 0;
    this.cooldown = false;
  }
  updateBaseline(diff) {
    this.baselineWindow.push(diff);
    if (this.baselineWindow.length > BASELINE_WINDOW_SIZE) this.baselineWindow.shift();
    this.baselineDiff = this.baselineWindow.reduce((a, b) => a + b) / this.baselineWindow.length;
  }
  triggerCooldown() {
    this.cooldown = true;
    setTimeout(() => this.cooldown = false, COOLDOWN_TIME);
  }
}

export function angleDiff(a, b) {
  let diff = a - b;
  return Math.abs(Math.atan2(Math.sin(diff), Math.cos(diff)));
}

export function verticalRef(pose) {
  const nose = pose.keypoints.find(k => k.name === 'nose');
  const hips = ['left_hip', 'right_hip'].map(name => pose.keypoints.find(k => k.name === name));
  if (hips.some(kp => kp.score < 0.3) || nose.score < 0.3) return Math.PI / 2;
  const midHip = { x: (hips[0].x + hips[1].x) / 2, y: (hips[0].y + hips[1].y) / 2 };
  return Math.atan2(midHip.y - nose.y, midHip.x - nose.x);
}

export function detectKick(foot, hip, ankle, verticalAngle, side, ctx, dc) {
  if (hip.score < 0.3 || ankle.score < 0.3 || foot.cooldown) return;
  const legAngle = Math.atan2(ankle.y - hip.y, ankle.x - hip.x);
  const diff = angleDiff(legAngle, verticalAngle);
  if (foot.baselineDiff === null) foot.updateBaseline(diff);

  foot.updateBaseline(diff);

  if (foot.state === 'waiting' && diff > foot.baselineDiff + MIN_ANGLE_DIFF) {
    foot.state = 'extended';
    foot.maxDiff = diff;
  } else if (foot.state === 'extended') {
    if (diff > foot.maxDiff) foot.maxDiff = diff;
    if (diff < foot.maxDiff * PEAK_DROP_RATIO) {
      // Draw or indicate kick
      indicateKick(side, ctx, dc);
      foot.triggerCooldown();
      foot.state = 'retracting';
    }
  } else if (foot.state === 'retracting' && diff < foot.baselineDiff + MIN_ANGLE_DIFF / 2) {
    foot.state = 'waiting';
  }
}

function indicateKick(side, ctx, dc) {
  ctx.fillStyle = side === 'Left' ? 'red' : 'blue';
  ctx.font = 'bold 30px Arial';
  ctx.textAlign = side === 'Left' ? 'left' : 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(`${side} Kick!`, side === 'Left' ? 10 : ctx.canvas.width - 10, 10);

  // Send kick event via data channel if available.
  if (dc && dc.readyState === 'open') {
    dc.send(side === 'Left' ? "left_kick" : "right_kick");
  }
}

export function drawSkeleton(pose, ctx, scaleX, scaleY) {
  ctx.strokeStyle = 'green';
  ctx.lineWidth = 3;
  connections.forEach(([kp1, kp2]) => {
    const keypoint1 = pose.keypoints.find(kp => kp.name === kp1);
    const keypoint2 = pose.keypoints.find(kp => kp.name === kp2);
    if (keypoint1 && keypoint2 && keypoint1.score > 0.3 && keypoint2.score > 0.3) {
      ctx.beginPath();
      ctx.moveTo(keypoint1.x * scaleX, keypoint1.y * scaleY);
      ctx.lineTo(keypoint2.x * scaleX, keypoint2.y * scaleY);
      ctx.stroke();
    }
  });
}

export function drawKeypoints(pose, ctx, scaleX, scaleY) {
  pose.keypoints.forEach(keypoint => {
    if (keypoint.score > 0.3) {
      ctx.font = 'bold 7px Arial';
      ctx.beginPath();
      ctx.arc(keypoint.x * scaleX, keypoint.y * scaleY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.fillText(keypoint.name, keypoint.x * scaleX + 6, keypoint.y * scaleY + 2);
    }
  });
}
