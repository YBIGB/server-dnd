/**
 * 掷一个 D20 骰子，返回 1~20 的随机整数
 */
function rollD20() {
  return Math.floor(Math.random() * 20) + 1;
}

/**
 * 根据属性值计算调整值
 * 3~10: 调整值 = 属性值 - 5（即 -2 ~ +5）
 * 公式：modifier = statValue - 5
 */
function calcModifier(statValue) {
  return statValue - 5;
}

/**
 * 执行一次属性检定
 * @param {number} statValue - 属性值
 * @param {number} dc - 难度等级
 * @returns {RollResult}
 */
function check(statValue, dc) {
  const raw = rollD20();
  const modifier = calcModifier(statValue);
  const total = raw + modifier;
  const passed = total >= dc;

  const outcomes = {
    success: [
      '你成功了！',
      '干得漂亮！行动顺利完成。',
      '命运眷顾了你，一切顺利。',
      '你巧妙地完成了这次行动。',
    ],
    fail: [
      '你失败了……',
      '运气不佳，行动没有成功。',
      '这次尝试没有达到预期效果。',
      '出师不利，行动未能成功。',
    ],
    critSuccess: [
      '大成功！自然 20！你以惊人的表现完成了行动！',
    ],
    critFail: [
      '大失败！自然 1！事情变得非常糟糕……',
    ],
  };

  let desc;
  if (raw === 20) {
    desc = outcomes.critSuccess[0];
  } else if (raw === 1) {
    desc = outcomes.critFail[0];
  } else {
    const pool = passed ? outcomes.success : outcomes.fail;
    desc = pool[Math.floor(Math.random() * pool.length)];
  }

  return { raw, modifier, total, dc, success: passed, description: desc };
}

module.exports = { rollD20, calcModifier, check };
