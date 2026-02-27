const fs = require('fs');

const files = fs.readdirSync('E:/Cards/midi/new1').filter(f => f.endsWith('.mid') || f.endsWith('.mid.mid'));

function extractTitleArtist(filename) {
    let clean = filename.replace('.mid.mid', '').replace('.mid', '').trim();
    // remove stuff in brackets
    clean = clean.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();

    // heuristics for splitting
    if (clean.includes(' - ')) {
        const parts = clean.split(' - ');
        return { artist: parts[0].trim(), title: parts[1].trim() };
    } else if (clean.includes('-')) {
        const parts = clean.split('-');
        return { artist: parts[0].trim(), title: parts[1].trim() };
    } else if (clean.includes(' by ')) {
        const parts = clean.split(' by ');
        return { artist: parts[1].trim(), title: parts[0].trim() };
    }

    return { artist: 'Unknown', title: clean };
}

const entries = files.map((f, i) => {
    let { artist, title } = extractTitleArtist(f);
    // some manual fixes for bad names
    if (f.includes('BLACKPINK')) { artist = 'BLACKPINK'; title = title.replace('BLACKPINK', '').replace('-', '').trim() || 'Track'; }
    if (f.includes('Dynamite')) { artist = 'BTS'; title = 'Dynamite'; }
    if (f.includes('BUTTER')) { artist = 'BTS'; title = 'Butter'; }
    if (f.includes('Bastille')) { artist = 'Bastille'; title = 'Pompeii'; }
    if (f.includes('Beautiful Things')) { artist = 'Benson Boone'; title = 'Beautiful Things'; }
    if (f.includes('Boy With Luv')) { artist = 'BTS'; title = 'Boy With Luv'; }
    if (f.includes('Callaíta')) { artist = 'Bad Bunny'; title = 'Callaíta'; }
    if (f.includes('Calum Scott')) { artist = 'Calum Scott'; title = 'You Are The Reason'; }
    if (f.includes('Danza Kuduro')) { artist = 'Don Omar'; title = 'Danza Kuduro'; }
    if (f.includes('Skinny Love')) { artist = 'Bon Iver'; title = 'Skinny Love'; }
    if (f.includes("Don't Stop Believin")) { artist = 'Journey'; title = "Don't Stop Believin"; }
    if (f.includes("Drake - God's Plan")) { artist = 'Drake'; title = "God's Plan"; }
    if (f.includes('I See Fire')) { artist = 'Ed Sheeran'; title = 'I See Fire'; }
    if (f.includes('Ella Baila Sola')) { artist = 'Eslabon Armado, Peso Pluma'; title = 'Ella Baila Sola'; }
    if (f.includes('Love The Way You Lie')) { artist = 'Eminem ft. Rihanna'; title = 'Love The Way You Lie'; }
    if (f.includes('Fireflies')) { artist = 'Owl City'; title = 'Fireflies'; }
    if (f.includes('Grenade')) { artist = 'Bruno Mars'; title = 'Grenade'; }
    if (f.includes('November Rain')) { artist = "Guns N' Roses"; title = 'November Rain'; }
    if (f.includes('HUMBLE')) { artist = 'Kendrick Lamar'; title = 'HUMBLE.'; }
    if (f.includes('Hotline Bling')) { artist = 'Drake'; title = 'Hotline Bling'; }
    if (f.includes('Take Me To Church')) { artist = 'Hozier'; title = 'Take Me To Church'; }
    if (f.includes('Lucid Dreams')) { artist = 'Juice WRLD'; title = 'Lucid Dreams'; }
    if (f.includes('LA CANCIÓN')) { artist = 'Bad Bunny, J Balvin'; title = 'LA CANCIÓN'; }
    if (f.includes('Losing My Religion')) { artist = 'R.E.M.'; title = 'Losing My Religion'; }
    if (f.includes('Ludovico')) { artist = 'Ludovico Einaudi'; title = 'Experience'; }
    if (f.includes('Nothing Else Matters')) { artist = 'Metallica'; title = 'Nothing Else Matters'; }
    if (f.includes('One Dance')) { artist = 'Drake'; title = 'One Dance'; }
    if (f.includes('Apologize')) { artist = 'OneRepublic'; title = 'Apologize'; }
    if (f.includes('Pink Venom')) { artist = 'BLACKPINK'; title = 'Pink Venom'; }
    if (f.includes('Propuesta Indecente')) { artist = 'Romeo Santos'; title = 'Propuesta Indecente'; }
    if (f.includes('Gangnam Style')) { artist = 'Psy'; title = 'Gangnam Style'; }
    if (f.includes('Riptide')) { artist = 'Vance Joy'; title = 'Riptide'; }
    if (f.includes('Rockstar')) { artist = 'Post Malone'; title = 'Rockstar'; }
    if (f.includes('SAD')) { artist = 'XXXTENTACION'; title = 'SAD!'; }
    if (f.includes('See You Again')) { artist = 'Wiz Khalifa ft. Charlie Puth'; title = 'See You Again'; }
    if (f.includes('Unstoppable')) { artist = 'Sia'; title = 'Unstoppable'; }
    if (f.includes('Chandelier')) { artist = 'Sia'; title = 'Chandelier'; }
    if (f.includes('Toxic')) { artist = 'Britney Spears'; title = 'Toxic'; }
    if (f.includes('Stay With Me')) { artist = 'Sam Smith'; title = 'Stay With Me'; }
    if (f.includes('Stressed Out')) { artist = 'Twenty One Pilots'; title = 'Stressed Out'; }
    if (f.includes('Everybody Wants to Rule the World')) { artist = 'Tears for Fears'; title = 'Everybody Wants to Rule the World'; }
    if (f.includes('Build a Home')) { artist = 'The Cinematic Orchestra'; title = 'To Build a Home'; }
    if (f.includes('Night We Met')) { artist = 'Lord Huron'; title = 'The Night We Met'; }
    if (f.includes('The Hills')) { artist = 'The Weeknd'; title = 'The Hills'; }
    if (f.includes('Starboy')) { artist = 'The Weeknd'; title = 'Starboy'; }
    if (f.includes('Tití Me Preguntó')) { artist = 'Bad Bunny'; title = 'Tití Me Preguntó'; }
    if (f.includes('Another Love')) { artist = 'Tom Odell'; title = 'Another Love'; }
    if (f.includes('SICKO MODE')) { artist = 'Travis Scott'; title = 'SICKO MODE'; }
    if (f.includes('goosebumps')) { artist = 'Travis Scott'; title = 'Goosebumps'; }
    if (f.includes('With or Without You')) { artist = 'U2'; title = 'With or Without You'; }
    if (f.includes('We Found Love')) { artist = 'Rihanna'; title = 'We Found Love'; }
    if (f.includes("party's over")) { artist = 'Billie Eilish'; title = "When the Party's Over"; }
    if (f.includes('Without me')) { artist = 'Halsey'; title = 'Without Me'; }
    if (f.includes('Wonderwall')) { artist = 'Oasis'; title = 'Wonderwall'; }
    if (f.includes('Jocelyn Flores')) { artist = 'XXXTENTACION'; title = 'Jocelyn Flores'; }
    if (f.includes('Youth')) { artist = 'Daughter'; title = 'Youth'; }
    if (f.includes('Love Scenario')) { artist = 'iKON'; title = 'Love Scenario'; }
    if (f.includes('diamonds')) { artist = 'Rihanna'; title = 'Diamonds'; }
    if (f.includes('umbrella')) { artist = 'Rihanna'; title = 'Umbrella'; }
    if (f.includes('sweater weather')) { artist = 'The Neighbourhood'; title = 'Sweater Weather'; }
    if (f.includes('africa')) { artist = 'Toto'; title = 'Africa'; }
    if (f.includes('Heathens')) { artist = 'Twenty One Pilots'; title = 'Heathens'; }

    // safe title/artist escapes for code generation
    title = title.replace(/'/g, "\\'").replace(/"/g, '\\"').trim();
    artist = artist.replace(/'/g, "\\'").replace(/"/g, '\\"').trim();
    f = f.replace(/'/g, "\\'").replace(/"/g, '\\"').trim();

    return `    { id: 'new1-${String(i + 1).padStart(2, '0')}', title: '${title}', artist: '${artist}', folder: 'new1', file: '${f}' },`;
});
console.log(entries.join('\n'));
