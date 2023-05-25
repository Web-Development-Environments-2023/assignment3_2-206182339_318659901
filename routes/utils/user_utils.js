const DButils = require("./DButils");

async function markAsFavorite(user_id, recipe_id){
    await DButils.execQuery(`insert into favoriterecipes values ('${user_id}',${recipe_id})`);
}

async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from favoriterecipes where user_id='${user_id}'`);
    return recipes_id;
}

async function getSeenRecipes(user_id){
    const recipes_id = await DButils.execQuery(`SELECT recipe_id 
    FROM recipeseen WHERE user_id = ${user_id} ORDER BY id desc LIMIT 3;`);
    
    return recipes_id;
}


exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.getSeenRecipes = getSeenRecipes;
