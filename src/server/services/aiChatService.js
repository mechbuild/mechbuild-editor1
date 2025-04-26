class AIChatService {
    static async generateResponse(project, question) {
        try {
            // Basic rule-based response engine
            const responses = [];
            const { name, buildingType, area, floorCount, location } = project;
            const q = question.toLowerCase();

            // System recommendations based on building characteristics
            if (q.includes('sistem') || q.includes('öner')) {
                if (area > 1000) {
                    responses.push({
                        type: 'system',
                        content: '🚨 Yangın Sprinkler Sistemi Önerisi:',
                        details: `${area}m² alan için yangın yönetmeliği gereği otomatik sprinkler sistemi zorunludur. Bu sistem, yangın durumunda erken müdahale sağlayarak can ve mal güvenliğini korur.`
                    });
                }

                if (buildingType?.toLowerCase().includes('otel')) {
                    responses.push({
                        type: 'system',
                        content: '🌡️ HVAC Sistem Önerisi:',
                        details: 'Otel yapılarında merkezi HVAC sistemi zorunludur. Misafir konforu ve enerji verimliliği için değişken debili (VRF/VRV) sistem önerilir.'
                    });
                }

                if (floorCount > 5) {
                    responses.push({
                        type: 'system',
                        content: '🛗 Asansör Sistem Önerisi:',
                        details: `${floorCount} katlı yapı için en az 2 adet asansör önerilir. Trafik hesabı yapılarak kapasite ve hız optimizasyonu sağlanmalıdır.`
                    });
                }
            }

            // Climate-based recommendations
            if (q.includes('ısı') || q.includes('iklim') || 
                location?.toLowerCase().includes('erzurum') || 
                location?.toLowerCase().includes('kars')) {
                responses.push({
                    type: 'climate',
                    content: '❄️ İklim Bazlı Öneri:',
                    details: 'Soğuk iklim bölgesi için yüksek ısı yalıtım katsayısı (U-değeri) önerilir. Duvar ve çatı yalıtımında minimum 10cm XPS/taşyünü kullanılmalıdır.'
                });
            }

            // Energy efficiency recommendations
            if (q.includes('enerji') || q.includes('tasarruf')) {
                responses.push({
                    type: 'energy',
                    content: '⚡ Enerji Verimliliği Önerileri:',
                    details: 'LED aydınlatma, hareket sensörleri, güneş panelleri ve ısı geri kazanım sistemleri önerilir. Bu sistemler ilk yatırım maliyetini 3-5 yıl içinde amorti eder.'
                });
            }

            // Water management recommendations
            if (q.includes('su') || q.includes('sıhhi')) {
                responses.push({
                    type: 'water',
                    content: '💧 Su Yönetimi Önerileri:',
                    details: 'Gri su geri kazanım sistemi, yağmur suyu toplama sistemi ve fotoselli bataryalar önerilir. Bu sistemler su tüketimini %30-40 oranında azaltabilir.'
                });
            }

            // If no specific matches, provide a general response
            if (responses.length === 0) {
                responses.push({
                    type: 'general',
                    content: '🤔 Genel Yanıt:',
                    details: 'Lütfen daha spesifik bir soru sorun. Örneğin: "Bu projeye hangi mekanik sistemler önerilir?" veya "Enerji tasarrufu için neler yapılabilir?"'
                });
            }

            // Format the response
            const formattedResponse = responses.map(r => 
                `${r.content}\n${r.details}`
            ).join('\n\n');

            return {
                success: true,
                answer: formattedResponse,
                suggestions: responses
            };

        } catch (error) {
            console.error('AI Chat Error:', error);
            return {
                success: false,
                error: 'AI yanıtı oluşturulurken bir hata oluştu'
            };
        }
    }

    static async handleCommand(project, command) {
        try {
            const response = {
                activateModules: [],
                deactivateModules: [],
                message: "",
                suggestions: []
            };

            const text = command.toLowerCase();
            const { buildingType, area } = project;

            // Yangın sistemi kontrolü
            if (text.includes('yangın')) {
                if (area > 1000) {
                    response.activateModules.push('fire');
                    response.message = 'Yangın modülü aktif edildi (alan > 1000 m²). Sprinkler sistemi zorunludur.';
                    response.suggestions.push({
                        type: 'system',
                        content: '🚨 Yangın Sistemi Aktivasyonu:',
                        details: `${area}m² alan için yangın yönetmeliği gereği otomatik sprinkler sistemi zorunludur.`
                    });
                } else {
                    response.message = 'Yangın sistemi küçük alanlar için opsiyoneldir.';
                    response.suggestions.push({
                        type: 'warning',
                        content: '⚠️ Uyarı:',
                        details: 'Alan 1000m²\'den küçük olduğu için yangın sistemi opsiyoneldir.'
                    });
                }
            }

            // Enerji modülü kontrolü
            if (text.includes('enerji')) {
                if (text.includes('kapat')) {
                    response.deactivateModules.push('energy');
                    response.message = 'Enerji modülü devre dışı bırakıldı.';
                    response.suggestions.push({
                        type: 'warning',
                        content: '⚠️ Enerji Modülü Deaktivasyonu:',
                        details: 'Enerji verimliliği hesaplamaları devre dışı bırakıldı.'
                    });
                } else {
                    response.activateModules.push('energy');
                    response.message = 'Enerji verimliliği modülü aktif edildi.';
                    response.suggestions.push({
                        type: 'system',
                        content: '⚡ Enerji Modülü Aktivasyonu:',
                        details: 'LED aydınlatma, hareket sensörleri ve ısı geri kazanım sistemleri aktif edildi.'
                    });
                }
            }

            // HVAC/Taze hava kontrolü
            if (text.includes('taze hava') || text.includes('havalandırma')) {
                if (buildingType?.toLowerCase().includes('otel')) {
                    response.activateModules.push('hvac');
                    response.message = 'HVAC sistemi aktif edildi (otel yapısı).';
                    response.suggestions.push({
                        type: 'system',
                        content: '🌡️ HVAC Sistemi Aktivasyonu:',
                        details: 'Merkezi HVAC sistemi ve değişken debili (VRF/VRV) sistem aktif edildi.'
                    });
                } else {
                    response.message = 'Taze hava ihtiyacı yapı tipine göre değerlendirilecek.';
                    response.suggestions.push({
                        type: 'info',
                        content: 'ℹ️ HVAC Değerlendirmesi:',
                        details: 'Yapı tipi ve kullanım amacına göre HVAC gereksinimleri belirlenecek.'
                    });
                }
            }

            if (response.activateModules.length === 0 && response.deactivateModules.length === 0) {
                response.message = 'Komutu anlamadım, lütfen daha net ifade edin.';
                response.suggestions.push({
                    type: 'error',
                    content: '❌ Komut Anlaşılamadı:',
                    details: 'Örnek komutlar: "yangın sistemi ekle", "enerji modülünü kapat", "taze hava gerekli mi?"'
                });
            }

            return {
                success: true,
                ...response
            };

        } catch (error) {
            console.error('AI Command Error:', error);
            return {
                success: false,
                error: 'Komut işlenirken bir hata oluştu'
            };
        }
    }
}

module.exports = AIChatService; 