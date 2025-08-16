// This would be implemented as a serverless function
// Example using GitHub API via a serverless platform

const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    const filename = event.queryStringParameters.file;
    
    try {
        // 1. Delete the post file
        const postPath = path.join(__dirname, '../posts', filename);
        fs.unlinkSync(postPath);
        
        // 2. Update index.json
        const indexPath = path.join(__dirname, '../posts/index.json');
        const indexData = JSON.parse(fs.readFileSync(indexPath));
        indexData.posts = indexData.posts.filter(p => p.file !== filename);
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
