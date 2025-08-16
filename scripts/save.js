const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    const { filename, title, content } = JSON.parse(event.body);
    
    try {
        // 1. Save the post content
        const postPath = path.join(__dirname, '../posts', filename);
        fs.writeFileSync(postPath, content);
        
        // 2. Update index.json
        const indexPath = path.join(__dirname, '../posts/index.json');
        const indexData = JSON.parse(fs.readFileSync(indexPath));
        
        // Update or add the post metadata
        const existingIndex = indexData.posts.findIndex(p => p.file === filename);
        if (existingIndex >= 0) {
            indexData.posts[existingIndex].title = title;
        } else {
            indexData.posts.push({
                file: filename,
                title: title,
                date: new Date().toISOString()
            });
        }
        
        fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
        
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false,
                message: error.message 
            })
        };
    }
};
