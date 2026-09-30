const fs = require('fs');
const path = require('path');

const file = path.resolve('src/components/RadioManager.jsx');
let content = fs.readFileSync(file, 'utf8');

const targetStr = "const albumList = useMemo(() => {";
const targetIdx = content.indexOf(targetStr);

console.log("Index of albumList:", targetIdx);

if (targetIdx === -1) {
  console.error("albumList not found!");
  process.exit(1);
}

// Find previous newline before albumList
const lineStart = content.lastIndexOf('\n', targetIdx);

const insertCode = `
  // Lista plana de canciones de la biblioteca del Bat
  const libraryTracks = useMemo(() => {
    const list = [];
    (batCatalog || []).forEach(alb => {
      (alb.tracks || []).forEach(t => {
        list.push({
          ...t,
          folderName: alb.folderName,
          album: alb.albumName || t.album,
          artist: t.artist || alb.artist,
          albumArtist: alb.artist,
          cover: t.cover || alb.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400'
        });
      });
    });
    return list;
  }, [batCatalog]);

  const filteredLibraryTracks = useMemo(() => {
    if (!librarySearchQuery.trim()) return libraryTracks;
    const q = librarySearchQuery.toLowerCase();
    return libraryTracks.filter(t => 
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.artist && t.artist.toLowerCase().includes(q)) ||
      (t.album && t.album.toLowerCase().includes(q))
    );
  }, [libraryTracks, librarySearchQuery]);
`;

// Insert before albumList and also enhance albumList to return batCatalog if present
const mapStr = "const map = new Map();";
const mapIdx = content.indexOf(mapStr, targetIdx);

let newContent = content.substring(0, lineStart) + insertCode + content.substring(lineStart, mapIdx) + `if (batCatalog && batCatalog.length > 0) {\n      return batCatalog;\n    }\n    ` + content.substring(mapIdx);

fs.writeFileSync(file, newContent, 'utf8');
console.log("Successfully defined libraryTracks and filteredLibraryTracks!");
