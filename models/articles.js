const connection = require('../db/connection');

exports.selectArticleById = (article_id) => {
    return connection('articles')
    .leftJoin('comments', 'articles.article_id', 'comments.article_id')
    .count({comment_count: 'comments.comment_id'})
    .groupBy('articles.article_id')
    .select('articles.*')
    .where('articles.article_id', article_id)
    .first()
    .then((article) => {
        if(!article) {
            return Promise.reject({
                status: 404,
                message: `Article with article_id: ${article_id} does not exist.`
            });
        }
        return article;
    });
}

exports.updateArticleVotes = (article_id, body) => {
    if(!body.inc_votes) {
        return Promise.reject({
            status: 400,
            message: '"inc_votes" must be included on the body in order to update "votes"'
        });
    }
    if(Object.keys(body).length !== 1) {
        return Promise.reject({
            status: 400,
            message: '"inc_votes" must be the only item on the body in order to update "votes"'
        });
    }
    const inc_votes = body.inc_votes;
    return connection('articles')
    .where({article_id})
    .increment('votes', inc_votes)
    .returning('*')
    .then(([article]) => {
        if(!article) {
            return Promise.reject({
                status: 404,
                message: `Article with article_id: ${article_id} does not exist.`
            });
        }
        return article;
    });
}

exports.addComment = (article_id, {username, body}) => {
    const newComment = {
        author: username,
        body,
        article_id
    }
    return connection('comments')
    .insert(newComment)
    .returning('*')
    .then(([comment]) => {
        return comment
    });
}

exports.selectComments = (article_id, sort_by, order) => {
    if (order !== undefined && order !== 'asc' && order !== 'desc') {
        return Promise.reject({
            status: 400,
            message: `Order: "${order}" is not allowed.`
        });
    }
    return connection('comments')
    .select('*')
    .where({article_id})
    .orderBy(sort_by || 'created_at', order || 'desc')
    .then(comments => {
        if (!comments.length) {
            return connection('articles')
            .select('*')
            .where({article_id})
            .then(([article]) => {
                if(!article) {
                    return Promise.reject({
                        status: 404,
                        message: `Article with article_id: ${article_id} does not exist.`
                    });
                } else return [];
            });
        } else return comments;
    });
}