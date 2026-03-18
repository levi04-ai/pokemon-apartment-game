// puzzle.js - Quiz and mini-game system
const Puzzle = {
    active: false,
    currentQuestion: 0,
    score: 0,
    totalQuestions: 5,

    questions: [
        { q: '?מתי הכרנו', options: ['2019', '2020', '2021', '2022'], correct: 1,
          response: { right: '!נכון! זיכרון מעולה', wrong: '!לא... בוא ננסה שוב' }},
        { q: '?מה האוכל האהוב של טל', options: ['פיצה', 'סושי', 'פסטה', 'המבורגר'], correct: 2,
          response: { right: '!כן! פסטה זה הכי טוב', wrong: '!לא, אני הכי אוהבת פסטה' }},
        { q: '?מה הצבע האהוב של אדם', options: ['אדום', 'כחול', 'ירוק', 'שחור'], correct: 1,
          response: { right: '!מכיר את עצמך טוב', wrong: '?באמת? בטוח' }},
        { q: '?לאן טסנו בחופשה האחרונה', options: ['יוון', 'איטליה', 'תאילנד', 'ברצלונה'], correct: 0,
          response: { right: '!יוון הייתה מדהימה', wrong: '!לא, היינו ביוון' }},
        { q: '?מה הסרט האהוב שלנו', options: ['הנוקמים', 'טיטניק', 'אינספציה', 'לה לה לנד'], correct: 2,
          response: { right: '!סרט גאוני', wrong: '!אינספציה, ברור' }},
        { q: '?מה שם החתול שרצינו לאמץ', options: ['מיצי', 'לונה', 'שוקו', 'ביסלי'], correct: 3,
          response: { right: '!ביסלי! השם הכי חמוד', wrong: '!ביסלי! איך שכחת' }},
        { q: '?באיזה קומה הדירה שלנו', options: ['2', '3', '4', '5'], correct: 2,
          response: { right: '!נכון, קומה 4', wrong: '!קומה 4! אתה גר פה' }},
        { q: '?מה אדם הכי אוהב לעשות', options: ['לבשל', 'לתכנת', 'לצייר', 'לרוץ'], correct: 1,
          response: { right: '!כן, תכנות זה החיים', wrong: '!לתכנת כמובן' }},
    ],

    shuffledQuestions: [],

    startQuiz() {
        this.active = true;
        this.currentQuestion = 0;
        this.score = 0;
        this.shuffledQuestions = [...this.questions]
            .sort(() => Math.random() - 0.5)
            .slice(0, this.totalQuestions);
        UI.showDialog('טל', `!בוא נתחיל! ${this.totalQuestions} שאלות`, () => this.askQuestion());
    },

    askQuestion() {
        if (this.currentQuestion >= this.shuffledQuestions.length) { this.endQuiz(); return; }
        const q = this.shuffledQuestions[this.currentQuestion];
        UI.showDialog('טל', `שאלה ${this.currentQuestion + 1}: ${q.q}`, () => {
            UI.showMenu('?בחר תשובה', q.options, (choice, index) => {
                const isCorrect = index === q.correct;
                if (isCorrect) this.score++;
                UI.showDialog('טל', isCorrect ? q.response.right : q.response.wrong, () => {
                    this.currentQuestion++;
                    this.askQuestion();
                });
            });
        });
    },

    endQuiz() {
        this.active = false;
        const pct = this.score / this.totalQuestions;
        let message;
        if (pct === 1) message = [`!מושלם! ${this.score}/${this.totalQuestions}`, '!אתה מכיר אותי הכי טוב בעולם', '!אני אוהבת אותך'];
        else if (pct >= 0.6) message = [`!לא רע! ${this.score}/${this.totalQuestions}`, '.אבל אפשר יותר טוב'];
        else message = [`${this.score}/${this.totalQuestions} ...אוי`, '?אתה בטוח שאתה גר פה'];
        UI.showDialog('טל', message);
    }
};
