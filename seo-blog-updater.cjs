const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public', 'blog', 'post');

if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

    files.forEach(file => {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // Replace the call to action block with our SEO optimized one
        const ctaRegex = /<div class="call-to-action">[\s\S]*?<\/div>\s*<\/div>\s*<!-- Related Posts -->/i;

        // Check if what kind of card we are talking about
        const isThankYou = file.includes('thank-you');
        const isBirthday = file.includes('birthday');
        const isValentine = file.includes('valentine');
        const isBouquet = file.includes('bouquet');

        let specificLink = `<a href="../../greeting-card-maker">online greeting card maker</a>`;
        if (isThankYou) specificLink = `<a href="../../online-thank-you-card-maker">online thank you card maker</a>`;
        if (isBirthday) specificLink = `<a href="../../birthday/create">personalized birthday cards</a>`;
        if (isValentine) specificLink = `<a href="../../valentine/create">valentine's cards</a>`;

        const optimizedCta = `<div class="call-to-action">
                    <h3>Ready to Create Your Own Cards with E Greet?</h3>
                    <p>Now that you're inspired with these creative ideas, why not try making your own? <strong>E Greet</strong> is the top <a href="../../free-ecard-maker">free online ecard maker</a>. Whether you need an ${specificLink}, a <a href="../../beautiful-cards">beautiful card</a>, or just want to use the best <a href="../../greetings-card-maker">greetings card maker</a>, <strong>EGreet</strong> has you covered.</p>
                    <div class="cta-buttons">
                        <a href="../../" class="cta-button primary">Start Creating on EGreet</a>
                        <a href="../" class="cta-button secondary">More Blog Posts</a>
                    </div>
                </div>
            </div>

            <!-- Related Posts -->`;

        if (ctaRegex.test(content)) {
            content = content.replace(ctaRegex, optimizedCta);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated CTA in ${file}`);
        } else {
            console.log(`Could not find CTA block in ${file}`);
        }
    });
} else {
    console.log('Blog directory not found');
}
