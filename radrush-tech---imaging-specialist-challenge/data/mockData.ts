
import { Question, LeaderboardEntry } from '../types';

export const MOCK_QUESTIONS: Question[] = [
  {
    id: '1',
    question: "Khi chụp X-quang ngực thẳng (PA), tại sao cần yêu cầu bệnh nhân xoay vai ra trước và áp sát vào giá nhận ảnh?",
    options: [
      "Để làm giãn các cung sườn",
      "Để đẩy hai xương bả vai ra khỏi phế trường",
      "Để giảm liều phóng xạ cho tuyến giáp",
      "Để tim áp sát phim hơn"
    ],
    correctAnswer: 1,
    explanation: "Động tác xoay vai giúp tách xương bả vai ra khỏi trường phổi, giúp quan sát nhu mô phổi rõ ràng nhất mà không bị che lấp."
  },
  {
    id: '2',
    question: "Thông số nào trên máy X-quang quyết định trực tiếp đến độ xuyên thấu (độ cứng) của chùm tia?",
    options: ["mAs (Milliamperage-second)", "Khoảng cách (FFD)", "kVp (Kilovoltage peak)", "Kích thước tiêu điểm"],
    correctAnswer: 2,
    explanation: "kVp quyết định năng lượng và khả năng xuyên thấu của photon X-quang qua các tổ chức cơ thể."
  },
  {
    id: '3',
    question: "Trong kỹ thuật chụp CT Scanner, nhiễu ảnh 'Beam Hardening' (Cứng hóa chùm tia) thường xuất hiện do nguyên nhân nào?",
    options: [
      "Bệnh nhân cử động",
      "Xung quanh các vật thể có tỷ trọng cao như kim loại hoặc xương dày",
      "Tốc độ vòng quay bóng quá nhanh",
      "Sử dụng thuốc cản quang liều thấp"
    ],
    correctAnswer: 1,
    explanation: "Cứng hóa chùm tia xảy ra khi tia X đi qua các vật thể có số nguyên tử cao, làm lọc bỏ các photon năng lượng thấp, để lại các vệt đen/trắng trên ảnh."
  },
  {
    id: '4',
    question: "Nguyên tắc ALARA trong an toàn bức xạ viết tắt của cụm từ nào?",
    options: [
      "As Low As Reasonably Achievable",
      "Always Look At Radiation Area",
      "All Levels Are Really Acceptable",
      "As Long As Research Allows"
    ],
    correctAnswer: 0,
    explanation: "ALARA (Thấp nhất có thể đạt được một cách hợp lý) là nguyên tắc cốt lõi để bảo vệ nhân viên và bệnh nhân khỏi tác hại của tia xạ."
  },
  {
    id: '5',
    question: "Để giảm nhiễu ảnh do chuyển động hô hấp khi chụp X-quang bụng không chuẩn bị, kỹ thuật viên nên hướng dẫn bệnh nhân như thế nào?",
    options: ["Hít vào thật sâu và nín thở", "Thở đều nhẹ nhàng", "Thở ra hết sức và nín thở", "Vừa thở vừa chụp"],
    correctAnswer: 2,
    explanation: "Thở ra hết sức và nín thở giúp cơ hoành dâng cao, làm các tạng trong ổ bụng dàn trải đều và giảm nhiễu chuyển động."
  }
];

export const MOCK_LEADERBOARD_TODAY: LeaderboardEntry[] = [
  { id: 'm1', name: 'KTV. Trần Bình', score: 950, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Binh' },
  { id: 'm2', name: 'KTV. Lê Hoàng', score: 880, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hoang' },
  { id: 'm3', name: 'KTV. Nguyễn Thu', score: 820, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thu' },
];

export const MOCK_LEADERBOARD_WEEK: LeaderboardEntry[] = [
  { id: 'w1', name: 'KTV. Đặng Nam', score: 4500, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nam' },
  { id: 'w2', name: 'KTV. Trần Bình', score: 4200, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Binh' },
];
