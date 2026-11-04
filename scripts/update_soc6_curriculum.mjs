import fs from "fs";
import path from "path";

const dataPath = path.resolve("./classroom-app/src/lib/data/curriculum_master.json");
const rawData = fs.readFileSync(dataPath, "utf-8");
const subjects = JSON.parse(rawData);

const soc6Index = subjects.findIndex(s => s.id === "sub_soc_16101");
if (soc6Index === -1) {
  console.error("Subject sub_soc_16101 not found!");
  process.exit(1);
}

const soc6 = subjects[soc6Index];
const term1Units = soc6.units.filter(u => u.term === 1);

// Plan 1: 70:30 ratio (35 formative points + 15 summative points = 50 points)
const term2Units = [
  // สาระที่ 1: เศรษฐศาสตร์ (20 ชม. / 18 คะแนน)
  {
    unitNumber: 1,
    title: "ผู้ผลิตและผู้บริโภค",
    strand: "เศรษฐศาสตร์",
    term: 2,
    hours: 4,
    scoreWeight: 4,
    indicatorsBetween: [
      {
        code: "ส 3.1 ป.6/1",
        description: "อธิบายบทบาทของผู้ผลิตที่มีความรับผิดชอบ"
      },
      {
        code: "ส 3.1 ป.6/2",
        description: "อธิบายบทบาทของผู้บริโภคที่รู้เท่าทัน"
      }
    ],
    indicatorsEnd: [],
    learningTopics: [
      "บทบาทของผู้ผลิต : 1",
      "บทบาทของผู้ผลิต : 2",
      "บทบาทของผู้บริโภค",
      "กิจกรรมเสริมทักษะความรู้ท้ายหน่วยการเรียนรู้"
    ]
  },
  {
    unitNumber: 2,
    title: "การใช้ทรัพยากรอย่างยั่งยืน",
    strand: "เศรษฐศาสตร์",
    term: 2,
    hours: 5,
    scoreWeight: 4,
    indicatorsBetween: [],
    indicatorsEnd: [
      {
        code: "ส 3.1 ป.6/3",
        description: "บอกวิธีและประโยชน์ของการใช้ทรัพยากรอย่างยั่งยืน"
      }
    ],
    learningTopics: [
      "ความหมายและความจำเป็นของทรัพยากร",
      "ประเภทของทรัพยากร หลักการและวิธีการใช้ทรัพยากร",
      "ประโยชน์ของการใช้ทรัพยากรอย่างยั่งยืนและการสร้างจิตสำนึกให้คนเห็นคุณค่าของทรัพยากร",
      "การวางแผนการใช้ทรัพยากร",
      "กิจกรรมเสริมทักษะความรู้ท้ายหน่วยการเรียนรู้"
    ]
  },
  {
    unitNumber: 3,
    title: "ความสัมพันธ์ทางเศรษฐกิจ",
    strand: "เศรษฐศาสตร์",
    term: 2,
    hours: 7,
    scoreWeight: 6,
    indicatorsBetween: [],
    indicatorsEnd: [
      {
        code: "ส 3.2 ป.6/1",
        description: "อธิบายความสัมพันธ์ระหว่างผู้ผลิต ผู้บริโภค ธนาคาร และรัฐบาล"
      }
    ],
    learningTopics: [
      "ความสัมพันธ์ระหว่างผู้ผลิต ผู้บริโภค ธนาคาร และรัฐบาล",
      "การหารายได้ รายจ่าย การออม การลงทุนซึ่งแสดงความสัมพันธ์ระหว่างผู้ผลิต ผู้บริโภค และรัฐบาล",
      "ภาษี",
      "หน่วยงานที่จัดเก็บภาษี",
      "สิทธิของผู้บริโภค",
      "สิทธิของผู้ใช้แรงงานในประเทศไทย",
      "กิจกรรมเสริมทักษะความรู้ท้ายหน่วยการเรียนรู้"
    ]
  },
  {
    unitNumber: 4,
    title: "การรวมกลุ่มทางเศรษฐกิจภายในท้องถิ่น",
    strand: "เศรษฐศาสตร์",
    term: 2,
    hours: 4,
    scoreWeight: 4,
    indicatorsBetween: [
      {
        code: "ส 3.2 ป.6/2",
        description: "ยกตัวอย่างการรวมกลุ่มทางเศรษฐกิจภายในท้องถิ่น"
      }
    ],
    indicatorsEnd: [],
    learningTopics: [
      "กลุ่มออมทรัพย์",
      "กลุ่มแม่บ้าน",
      "กองทุนหมู่บ้าน",
      "กิจกรรมเสริมทักษะความรู้ท้ายหน่วยการเรียนรู้"
    ]
  },

  // สาระที่ 2: ภูมิศาสตร์ (20 ชม. / 17 คะแนน)
  {
    unitNumber: 1,
    title: "เครื่องมือทางภูมิศาสตร์",
    strand: "ภูมิศาสตร์",
    term: 2,
    hours: 5,
    scoreWeight: 4,
    indicatorsBetween: [
      {
        code: "ส 5.1 ป.6/1",
        description: "สืบค้นและอธิบายข้อมูลลักษณะทางกายภาพของประเทศไทย ด้วยแผนที่ รูปถ่ายทางอากาศ และภาพจากดาวเทียม"
      }
    ],
    indicatorsEnd: [],
    learningTopics: [
      "เครื่องมือทางภูมิศาสตร์ที่ให้ข้อมูลลักษณะทางกายภาพ",
      "แผนที่ : 1",
      "แผนที่ : 2",
      "แผนที่ : 3",
      "รูปถ่ายทางอากาศและภาพจากดาวเทียม"
    ]
  },
  {
    unitNumber: 2,
    title: "ธรรมชาติกับสังคมไทย",
    strand: "ภูมิศาสตร์",
    term: 2,
    hours: 5,
    scoreWeight: 4,
    indicatorsBetween: [
      {
        code: "ส 5.2 ป.6/2",
        description: "วิเคราะห์การเปลี่ยนแปลงทางกายภาพของประเทศไทยในอดีตกับปัจจุบัน และผลที่เกิดขึ้นจากการเปลี่ยนแปลง"
      }
    ],
    indicatorsEnd: [
      {
        code: "ส 5.2 ป.6/1",
        description: "วิเคราะห์ปฏิสัมพันธ์ระหว่างสิ่งแวดล้อมทางกายภาพ กับลักษณะกิจกรรมทางเศรษฐกิจ"
      }
    ],
    learningTopics: [
      "สิ่งแวดล้อมทางกายภาพในประเทศไทย",
      "สิ่งแวดล้อมทางกายภาพกับกิจกรรมทางเศรษฐกิจและสังคม",
      "ปฏิสัมพันธ์ระหว่างมนุษย์กับสิ่งแวดล้อม",
      "การเปลี่ยนแปลงทางกายภาพของประเทศไทยในอดีตกับปัจจุบัน",
      "ผลจากการเปลี่ยนแปลงทางกายภาพที่มีต่อกิจกรรมทางเศรษฐกิจและสังคมของประเทศไทยในอดีตกับปัจจุบัน"
    ]
  },
  {
    unitNumber: 3,
    title: "ภัยพิบัติในประเทศไทย",
    strand: "ภูมิศาสตร์",
    term: 2,
    hours: 7,
    scoreWeight: 6,
    indicatorsBetween: [
      {
        code: "ส 5.1 ป.6/2",
        description: "อธิบายความสัมพันธ์ระหว่างลักษณะทางกายภาพ และสังคมในประเทศไทยกับภัยพิบัติในประเทศไทย เพื่อเตรียมพร้อมรับมือภัยพิบัติ"
      }
    ],
    indicatorsEnd: [],
    learningTopics: [
      "แผ่นดินไหว",
      "สึนามิ",
      "วาตภัย",
      "ภัยแล้ง",
      "ดินถล่มและโคลนไหล",
      "อุทกภัย",
      "กิจกรรมเสริมทักษะความรู้ท้ายหน่วยการเรียนรู้"
    ]
  },
  {
    unitNumber: 4,
    title: "การจัดการทรัพยากรและ สิ่งแวดล้อมอย่างยั่งยืน",
    strand: "ภูมิศาสตร์",
    term: 2,
    hours: 3,
    scoreWeight: 3,
    indicatorsBetween: [],
    indicatorsEnd: [
      {
        code: "ส 5.2 ป.6/3",
        description: "นำเสนอตัวอย่างที่สะท้อนให้เห็นผลจากการรักษาและทำลายทรัพยากร และสิ่งแวดล้อม และเสนอแนวทาง ในการจัดการที่ยั่งยืนในประเทศไทย"
      }
    ],
    learningTopics: [
      "ทรัพยากรและสิ่งแวดล้อม",
      "สถานการณ์การรักษาและทำลายทรัพยากรและสิ่งแวดล้อมในประเทศไทย",
      "แนวทางการจัดการทรัพยากรและสิ่งแวดล้อมอย่างยั่งยืน"
    ]
  },

  // การวัดและประเมินผลปลายภาคเรียนที่ 2 (ปลายปี) (15 คะแนน)
  {
    unitNumber: 5,
    title: "การวัดและประเมินผลปลายภาคเรียนที่ 2",
    strand: "การวัดและประเมินผล",
    term: 2,
    hours: 0,
    scoreWeight: 15,
    indicatorsBetween: [],
    indicatorsEnd: [
      { code: "ส 3.1 ป.6/1", description: "อธิบายบทบาทของผู้ผลิตที่มีความรับผิดชอบ" },
      { code: "ส 3.1 ป.6/2", description: "อธิบายบทบาทของผู้บริโภคที่รู้เท่าทัน" },
      { code: "ส 3.1 ป.6/3", description: "บอกวิธีและประโยชน์ของการใช้ทรัพยากรอย่างยั่งยืน" },
      { code: "ส 3.2 ป.6/1", description: "อธิบายความสัมพันธ์ระหว่างผู้ผลิต ผู้บริโภค ธนาคาร และรัฐบาล" },
      { code: "ส 3.2 ป.6/2", description: "ยกตัวอย่างการรวมกลุ่มทางเศรษฐกิจภายในท้องถิ่น" },
      { code: "ส 5.1 ป.6/1", description: "ใช้เครื่องมือทางภูมิศาสตร์ในการสืบค้นข้อมูล" },
      { code: "ส 5.1 ป.6/2", description: "อธิบายลักษณะทางกายภาพที่ส่งผลต่อการเกิดภัยพิบัติ" },
      { code: "ส 5.2 ป.6/1", description: "วิเคราะห์ปฏิสัมพันธ์ระหว่างสิ่งแวดล้อมทางกายภาพกับกิจกรรมทางเศรษฐกิจและสังคม" },
      { code: "ส 5.2 ป.6/2", description: "วิเคราะห์การเปลี่ยนแปลงทางกายภาพของประเทศไทยในอดีตกับปัจจุบัน" },
      { code: "ส 5.2 ป.6/3", description: "นำเสนอแนวทางการจัดการทรัพยากรและสิ่งแวดล้อมอย่างยั่งยืน" }
    ],
    learningTopics: [
      "การทดสอบวัดผลสัมฤทธิ์ทางการเรียนปลายภาคเรียนที่ 2 (ปลายปี)"
    ]
  }
];

soc6.units = [...term1Units, ...term2Units];

fs.writeFileSync(dataPath, JSON.stringify(subjects, null, 2), "utf-8");

const t2Hours = term2Units.reduce((acc, u) => acc + u.hours, 0);
const t2Score = term2Units.reduce((acc, u) => acc + u.scoreWeight, 0);

console.log("✅ Successfully updated sub_soc_16101 curriculum:");
console.log(`   Term 1 Units: ${term1Units.length}`);
console.log(`   Term 2 Units: ${term2Units.length}`);
console.log(`   Total Term 2 Hours: ${t2Hours} hrs (Expected: 40 hrs)`);
console.log(`   Total Term 2 Score: ${t2Score} pts (Expected: 50 pts)`);
