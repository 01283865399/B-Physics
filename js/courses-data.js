(function () {
    'use strict';

    const formulas = {
        ohm: { symbol: 'V = I R', equation: 'V = I × R', description: 'فرق الجهد يساوي شدة التيار مضروبة في المقاومة.', unit: 'V بالفولت، I بالأمبير، R بالأوم' },
        kirchhoffCurrent: { symbol: 'ΣI الداخل = ΣI الخارج', equation: 'ΣI = 0 عند العقدة', description: 'مجموع التيارات الداخلة إلى العقدة يساوي مجموع التيارات الخارجة منها.', unit: 'I بالأمبير' },
        kirchhoffVoltage: { symbol: 'ΣΔV = 0', equation: 'ΣΔV = 0 في المسار المغلق', description: 'المجموع الجبري لفروق الجهد حول مسار مغلق يساوي صفرًا.', unit: 'V بالفولت' },
        force: { symbol: 'F = B I ℓ sin θ', equation: 'F = B × I × ℓ × sin(θ)', description: 'القوة المؤثرة في سلك يمر به تيار داخل مجال مغناطيسي.', unit: 'F بالنيوتن، B بالتسلا، I بالأمبير، ℓ بالمتر' },
        flux: { symbol: 'Φ = B A cos θ', equation: 'Φ = B × A × cos(θ)', description: 'الفيض المغناطيسي خلال مساحة في مجال منتظم.', unit: 'Φ بالويبر، B بالتسلا، A بالمتر المربع' },
        faraday: { symbol: 'ε = −N ΔΦ / Δt', equation: 'ε = −N × ΔΦ / Δt', description: 'القوة الدافعة المستحثة تتناسب مع معدل تغير الفيض المغناطيسي.', unit: 'ε بالفولت، N عدد اللفات، Φ بالويبر' },
        ac: { symbol: 'Veff = Vmax / √2', equation: 'Veff = Vmax / √2', description: 'قيمة الجهد الفعالة لموجة جيبية.', unit: 'Veff وVmax بالفولت' },
        photon: { symbol: 'E = h f', equation: 'E = h × f', description: 'طاقة الفوتون تساوي ثابت بلانك مضروبًا في التردد.', unit: 'E بالجول، h ثابت بلانك، f بالهرتز' },
        wave: { symbol: 'v = f λ', equation: 'v = f × λ', description: 'سرعة الموجة تساوي التردد مضروبًا في الطول الموجي.', unit: 'v م/ث، f هرتز، λ متر' },
        projectile: { symbol: 'x = v₀ cos(θ) t', equation: 'x = v₀ × cos(θ) × t', description: 'الإزاحة الأفقية في حركة المقذوف عند إهمال مقاومة الهواء.', unit: 'x بالمتر، v₀ م/ث، t بالثانية' },
        torque: { symbol: 'τ = r F sin θ', equation: 'τ = r × F × sin(θ)', description: 'مقدار عزم القوة حول محور.', unit: 'τ نيوتن·متر، r متر، F نيوتن' },
        momentum: { symbol: 'p = m v', equation: 'p = m × v', description: 'كمية التحرك لجسم تساوي كتلته مضروبة في سرعته.', unit: 'p كجم·م/ث، m كجم، v م/ث' },
        centripetal: { symbol: 'aᶜ = v² / r', equation: 'aᶜ = v² / r', description: 'مقدار العجلة المركزية في الحركة الدائرية المنتظمة.', unit: 'aᶜ م/ث²، v م/ث، r متر' },
        gravity: { symbol: 'F = G m₁ m₂ / r²', equation: 'F = G × m₁ × m₂ / r²', description: 'قوة التجاذب الكوني بين كتلتين نقطيتين.', unit: 'F نيوتن، الكتل كجم، r متر' },
        shm: { symbol: 'T = 2π √(ℓ / g)', equation: 'T = 2π × √(ℓ / g)', description: 'زمن دوري البندول البسيط للاهتزازات الصغيرة.', unit: 'T ثانية، ℓ متر، g م/ث²' },
        gas: { symbol: 'P V = n R T', equation: 'P × V = n × R × T', description: 'معادلة الحالة للغاز المثالي.', unit: 'P باسكال، V م³، n مول، T كلفن' },
        coulomb: { symbol: 'F = k q₁ q₂ / r²', equation: 'F = k × q₁ × q₂ / r²', description: 'مقدار القوة الكهربية بين شحنتين نقطيتين.', unit: 'F نيوتن، q كولوم، r متر' },
        field: { symbol: 'E = F / q', equation: 'E = F / q', description: 'شدة المجال الكهربي تساوي القوة لكل وحدة شحنة اختبار موجبة.', unit: 'E نيوتن/كولوم، F نيوتن، q كولوم' },
        capacitance: { symbol: 'C = Q / V', equation: 'C = Q / V', description: 'السعة الكهربية تساوي الشحنة على فرق الجهد.', unit: 'C فاراد، Q كولوم، V فولت' },
        idealGas: { symbol: 'P₁V₁/T₁ = P₂V₂/T₂', equation: 'P₁V₁ / T₁ = P₂V₂ / T₂', description: 'العلاقة العامة لكمية ثابتة من الغاز المثالي.', unit: 'درجة الحرارة المطلقة بالكلفن' },
        straightMotion: { symbol: 'v = u + a t', equation: 'v = u + a × t', description: 'إحدى معادلات الحركة بعجلة منتظمة.', unit: 'v وu م/ث، a م/ث²، t ثانية' },
        density: { symbol: 'ρ = m / V', equation: 'ρ = m / V', description: 'الكثافة تساوي الكتلة مقسومة على الحجم.', unit: 'ρ كجم/م³، m كجم، V م³' },
        heat: { symbol: 'Q = m c ΔT', equation: 'Q = m × c × ΔT', description: 'الحرارة المكتسبة أو المفقودة عند تغير درجة الحرارة دون تغير الحالة.', unit: 'Q جول، m كجم، c جول/(كجم·كلفن)' },
        kinetic: { symbol: 'Eₖ = ½ m v²', equation: 'Eₖ = ½ × m × v²', description: 'طاقة الحركة لجسم كتلته m وسرعته v.', unit: 'Eₖ جول، m كجم، v م/ث' },
        waveOptics: { symbol: 'β = λ D / d', equation: 'β = λ × D / d', description: 'عرض الهدبة في تجربة الشق المزدوج ليونج.', unit: 'β وλ وD وd بالمتر' },
        doppler: { symbol: 'f′ = f (v ± vₒ) / (v ∓ vₛ)', equation: 'f′ = f × (v ± vₒ) / (v ∓ vₛ)', description: 'صيغة تأثير دوبلر للصوت؛ تُختار الإشارات بحسب اتجاه الحركة.', unit: 'التردد بالهرتز والسرعات م/ث' },
        refraction: { symbol: 'n₁ sin θ₁ = n₂ sin θ₂', equation: 'n₁ × sin(θ₁) = n₂ × sin(θ₂)', description: 'قانون سنل لانكسار الضوء بين وسطين.', unit: 'n معامل انكسار، الزوايا بالدرجات أو الراديان' },
        kepler: { symbol: 'T² / r³ = ثابت', equation: 'T² / r³ = ثابت', description: 'مربع الزمن الدوري يتناسب مع مكعب نصف المحور الأكبر للمدار.', unit: 'T زمن، r طول' },
        work: { symbol: 'P = W / t', equation: 'P = W / t', description: 'القدرة هي الشغل المبذول في وحدة الزمن.', unit: 'P واط، W جول، t ثانية' },
        efficiency: { symbol: 'η = (النافع / الكلي) × 100%', equation: 'η = (Euseful / Einput) × 100%', description: 'الكفاءة نسبة الناتج النافع إلى المدخل الكلي.', unit: 'η نسبة مئوية' },
        conservation: { symbol: 'Σp قبل = Σp بعد', equation: 'مجموع كمية التحرك قبل التصادم = مجموعها بعده', description: 'تحفظ كمية التحرك الكلية في نظام معزول.', unit: 'p كجم·م/ث' },
        electricity: { symbol: 'P = V I', equation: 'P = V × I', description: 'القدرة الكهربية تساوي فرق الجهد مضروبًا في شدة التيار.', unit: 'P واط، V فولت، I أمبير' },
        deBroglie: { symbol: 'λ = h / p', equation: 'λ = h / p', description: 'طول موجة دي برولي لجسيم كمية تحركه p.', unit: 'λ متر، h جول·ثانية، p كجم·م/ث' },
        unit: { symbol: 'الكمية = العدد × الوحدة', equation: 'الكمية الفيزيائية = قيمة عددية × وحدة قياس', description: 'يجب التعبير عن القياس بقيمة عددية ووحدة مناسبة.', unit: 'تحدد الوحدة حسب الكمية' }
    };

    const optionEquations = ['v = f × λ', 'V = I × R', 'F = m × a', 'Q = m × c × ΔT'];
    const quizFor = (unit) => {
        const target = unit.formulas[0];
        const distractors = optionEquations.filter((equation) => equation !== target.equation).slice(0, 3);
        const options = [target.equation, ...distractors].sort();
        return {
            id: `${unit.id}-quiz`,
            title: `تدريب مبدئي: ${unit.title}`,
            questions: [{
                id: `${unit.id}-q1`,
                prompt: `أي علاقة من الآتي ترتبط بموضوع «${unit.title}»؟`,
                options,
                answer: options.indexOf(target.equation),
                explanation: target.description
            }]
        };
    };

    const makeUnit = (id, title, lessonTitles, formulaList) => {
        const selectedFormulas = formulaList.map((key) => formulas[key]);
        const unit = {
            id,
            title,
            description: 'محتوى الدروس والمواد التفصيلية يُستكمل بعد مطابقته مع الكتاب والمنهج المعتمد.',
            lessons: lessonTitles.map((lessonEntry, index) => {
                const lesson = typeof lessonEntry === 'string' ? { title: lessonEntry } : lessonEntry;
                return {
                    id: lesson.id || `${id}-lesson-${index + 1}`,
                    title: lesson.title,
                    description: lesson.description || '',
                    videoUrl: lesson.videoUrl || '',
                    summary: lesson.summary || '',
                    objectives: lesson.objectives || [],
                    resources: lesson.resources || [],
                    formulas: lesson.formulas || [selectedFormulas[Math.min(index, selectedFormulas.length - 1)]]
                };
            }),
            formulas: selectedFormulas
        };
        unit.quiz = quizFor(unit);
        return unit;
    };

    const makeCourse = (id, title, units, system) => ({
        id,
        title,
        units,
        systems: [system],
        lessonsCount: units.reduce((total, unit) => total + unit.lessons.length, 0)
    });

    const grade3General = makeCourse('grade-3-general-electricity', 'الصف الثالث الثانوي — الثانوية العامة (الدفعة الأخيرة)', [
        makeUnit('g3-current-electricity', 'الوحدة الأولى: الكهربية التيارية والكهرومغناطيسية', [
            'الفصل الأول: التيار الكهربي وقانون أوم',
            'الفصل الثاني: قانونا كيرشوف',
            'الفصل الثالث: التأثير المغناطيسي للتيار الكهربي',
            'الفصل الرابع: الحث الكهرومغناطيسي',
            'الفصل الخامس: دوائر التيار المتردد'
        ], ['ohm', 'kirchhoffCurrent', 'force', 'faraday', 'ac']),
        makeUnit('g3-modern-physics', 'الوحدة الثانية: مقدمة في الفيزياء الحديثة', [
            'الفصل الأول: ازدواجية الموجة والجسيم',
            'الفصل الثاني: الأطياف الذرية',
            'الفصل الثالث: الليزر',
            'الفصل الرابع: الإلكترونيات الحديثة'
        ], ['deBroglie', 'photon', 'photon', 'ohm'])
    ], 'general');

    const grade2Baccalaureate = makeCourse('grade-2-baccalaureate', 'الصف الثاني الثانوي — البكالوريا', [
        makeUnit('g2b-mechanics-waves', 'الجزء الأول: الميكانيكا والموجات', [
            'متجهات السرعة والسرعة النسبية',
            'حركة المقذوفات (أفقية وبزاوية)',
            'عزم القوة واتزان القوى',
            'القدرة والكفاءة وكمية التحرك',
            'حفظ كمية الحركة',
            'الحركة الدائرية المنتظمة والقوة المركزية',
            'قوانين كبلر والجاذبية الكونية',
            'الحركة التوافقية البسيطة والبندول',
            'الموجات الجيبية والتداخل والموجات الموقوفة',
            'تأثير دوبلر والانكسار والانعكاس الكلي',
            'تجربة الشق المزدوج ليونج'
        ], ['straightMotion', 'projectile', 'torque', 'work', 'conservation', 'centripetal', 'kepler', 'shm', 'wave', 'doppler', 'waveOptics']),
        makeUnit('g2b-thermal-electric-quantum', 'الجزء الثاني: الحرارة والكهرباء والمغناطيسية والكمية', [
            'قوانين الغازات ومعادلة الحالة',
            'الكهرباء الساكنة (قانون كولوم، المجال، الجهد، المكثف)',
            'التيار والدوائر (قانونا كيرشوف)',
            'المغناطيسية والحث الكهرومغناطيسي',
            'الطبيعة الكمية للضوء والمادة (الأشعة السينية، موجات المادة)'
        ], ['gas', 'coulomb', 'kirchhoffVoltage', 'faraday', 'photon'])
    ], 'baccalaureate');

    const grade1Baccalaureate = makeCourse('grade-1-integrated-sciences', 'الصف الأول الثانوي — العلوم المتكاملة (البكالوريا)', [
        makeUnit('g1-integrated-sciences', 'أساسيات فيزيائية ضمن العلوم المتكاملة', [
            'القياس والكميات الفيزيائية',
            'الحركة والطاقة في الأنظمة الطبيعية',
            'الحرارة وانتقال الطاقة',
            'الكهرباء والمغناطيسية في التطبيقات اليومية'
        ], ['unit', 'kinetic', 'heat', 'electricity'])
    ], 'baccalaureate');

    const grade2General = makeCourse('grade-2-general-physics', 'الصف الثاني الثانوي — الثانوية العامة', [
        makeUnit('g2g-measurement', 'الوحدة الأولى: الكميات الفيزيائية ووحدات القياس', [
            'الكميات الأساسية والمشتقة والتحويل بين الوحدات'
        ], ['unit']),
        makeUnit('g2g-linear-motion', 'الوحدة الثانية: الحركة الخطية', [
            'الإزاحة والسرعة والعجلة والحركة بعجلة منتظمة'
        ], ['straightMotion']),
        makeUnit('g2g-matter', 'الوحدة الثالثة: خواص المادة', [
            'الكثافة والخواص الميكانيكية للمادة'
        ], ['density']),
        makeUnit('g2g-heat', 'الوحدة الرابعة: الحرارة', [
            'الحرارة ودرجة الحرارة والسعة الحرارية'
        ], ['heat'])
    ], 'general');

    window.BETO_PHYSICS = {
        grades: [
            { id: 'grade-1', number: 'الأول الثانوي', systems: ['baccalaureate'], courses: [grade1Baccalaureate] },
            { id: 'grade-2', number: 'الثاني الثانوي', systems: ['baccalaureate', 'general'], courses: [grade2Baccalaureate, grade2General] },
            { id: 'grade-3', number: 'الثالث الثانوي', systems: ['general'], courses: [grade3General] }
        ],
        systems: {
            baccalaureate: 'البكالوريا',
            general: 'الثانوية العامة',
            azhar: 'الثانوي الأزهري'
        }
    };
})();
