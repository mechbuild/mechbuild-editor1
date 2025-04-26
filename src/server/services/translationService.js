class TranslationService {
    static getTranslations(lang) {
        const translations = {
            tr: {
                title: "MECHBUILD TEKNİK RAPOR",
                project: "Proje Adı",
                location: "Lokasyon",
                type: "Bina Tipi",
                area: "Alan",
                floor: "Kat Sayısı",
                systems: "AI Sistem Önerileri",
                suggestions: "Öneriler",
                requirements: "Gereksinimler",
                justification: "Gerekçe",
                technicalDetails: "Teknik Detaylar",
                costImpact: "Maliyet Etkisi",
                disclaimer: "Bu rapor otomatik olarak oluşturulmuştur. Tüm öneriler genel niteliktedir ve profesyonel bir değerlendirme gerektirir."
            },
            en: {
                title: "MECHBUILD TECHNICAL REPORT",
                project: "Project Name",
                location: "Location",
                type: "Building Type",
                area: "Area",
                floor: "Floors",
                systems: "AI System Suggestions",
                suggestions: "Suggestions",
                requirements: "Requirements",
                justification: "Justification",
                technicalDetails: "Technical Details",
                costImpact: "Cost Impact",
                disclaimer: "This report has been automatically generated. All suggestions are general in nature and require professional evaluation."
            },
            ar: {
                title: "تقرير فني من MECHBUILD",
                project: "اسم المشروع",
                location: "الموقع",
                type: "نوع المبنى",
                area: "المساحة",
                floor: "عدد الطوابق",
                systems: "اقتراحات النظام الذكية",
                suggestions: "اقتراحات",
                requirements: "المتطلبات",
                justification: "التبرير",
                technicalDetails: "التفاصيل التقنية",
                costImpact: "تأثير التكلفة",
                disclaimer: "تم إنشاء هذا التقرير تلقائيًا. جميع الاقتراحات ذات طبيعة عامة وتتطلب تقييمًا مهنيًا."
            },
            ru: {
                title: "ТЕХНИЧЕСКИЙ ОТЧЕТ MECHBUILD",
                project: "Название проекта",
                location: "Местоположение",
                type: "Тип здания",
                area: "Площадь",
                floor: "Этажность",
                systems: "Рекомендации ИИ по системам",
                suggestions: "Предложения",
                requirements: "Требования",
                justification: "Обоснование",
                technicalDetails: "Технические детали",
                costImpact: "Влияние на стоимость",
                disclaimer: "Этот отчет создан автоматически. Все предложения носят общий характер и требуют профессиональной оценки."
            }
        };

        return translations[lang] || translations["tr"];
    }
}

module.exports = TranslationService; 