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

async function CreateRecipe(user_id,image,title,readyInMinutes,popularity,glutenFree,vegan,vegetarian,ingredients,prepInstructions,numberOfDishes){
    const query = `INSERT INTO userrecipes (user_id,image,title, prep_time,vegetrian, vegan,gluten_free,number_of_dishes,ingredients,instructions,popularity) VALUES (${user_id},${image}'${title}',${readyInMinutes}, ${vegetarian},
    ${vegan},'${(glutenFree)}','${numberOfDishes}', '${ingredients}', ${prepInstructions}, 0)    
    `;
    await DButils.execQuery(query)
}
async function getRecipesPreview(){

}


exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.getSeenRecipes = getSeenRecipes;
exports.CreateRecipe=CreateRecipe;
exports.getRecipesPreview=getRecipesPreview;