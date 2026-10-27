import { roundScore, calculateWeightedScore, calculateTotalScore, calculateGrade } from './engine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runTests() {
  console.log('Running Calculation Engine Tests...');

  // Test Rounding
  assert(roundScore(10.4) === 10, '10.4 should round to 10');
  assert(roundScore(10.5) === 11, '10.5 should round to 11');
  assert(roundScore(10.555, 2) === 10.56, '10.555 rounded to 2 decimals should be 10.56');

  // Test Weighted Score
  // คะแนน 8 จาก 10, น้ำหนัก 15 => ได้คะแนนแปลง = (8/10)*15 = 12
  assert(calculateWeightedScore(8, 10, 15) === 12, '8/10 with weight 15 should be 12');
  assert(calculateWeightedScore(5, 10, 20) === 10, '5/10 with weight 20 should be 10');
  
  // Test Edge cases
  assert(calculateWeightedScore(0, 10, 15) === 0, '0 score should be 0');
  assert(calculateWeightedScore(12, 10, 15) === 18, 'Over max score should calculate proportionately');
  assert(calculateWeightedScore(5, 0, 15) === 0, 'Max score 0 should return 0 safely');

  // Test Total Score calculation
  const activities = [
    { id: 'a1', maxScore: 10, weightScore: 15 },
    { id: 'a2', maxScore: 20, weightScore: 20 },
    { id: 'a3', maxScore: 50, weightScore: 30 },
  ];
  const studentScores = [
    { activityId: 'a1', rawScore: 8 },  // (8/10)*15 = 12
    { activityId: 'a2', rawScore: 15 }, // (15/20)*20 = 15
    { activityId: 'a3', rawScore: 40 }, // (40/50)*30 = 24
  ];
  // 12 + 15 + 24 = 51
  assert(calculateTotalScore(studentScores, activities) === 51, 'Total score should be 51');

  // Test Grade calculation
  assert(calculateGrade(79.5) === "4", '79.5 should round to 80 and get grade 4');
  assert(calculateGrade(74.4) === "3", '74.4 should round to 74 and get grade 3');
  assert(calculateGrade(49.5) === "1", '49.5 should round to 50 and get grade 1');
  assert(calculateGrade(49.4) === "0", '49.4 should round to 49 and get grade 0');

  console.log('✅ All Calculation Engine tests passed!');
}

try {
  runTests();
} catch (e) {
  console.error(e);
  process.exit(1);
}
