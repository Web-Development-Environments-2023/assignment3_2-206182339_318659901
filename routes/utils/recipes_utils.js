const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const DButils = require("./DButils");
const { search } = require("../auth");
const { query } = require("express");



/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*}  recipes_info
 */


async function isfavorite(user_id,recipe_id){
    if (user_id===undefined){
        return false;
    }
    const rowscount= await DButils.execQuery(`SELECT * FROM favoriterecipes WHERE user_id=${user_id} AND recipe_id=${recipe_id}`);
    if (rowscount.length>0){
        return true;
    }
    return false;
}

async function is_seen(user_id,recipe_id){
    if (user_id===undefined){
        return false;
    }
    const rowscount= await DButils.execQuery(`SELECT * FROM recipeseen WHERE user_id=${user_id} AND recipe_id=${recipe_id}`);
    if (rowscount.length>0){
        return true;
    }
    return false;
}
async function getRandomRecipes(){
    const recipes = await axios.get(`${api_domain}/random`, {
        params:{
            number: 5,
            apiKey: process.env.api_token
        }
    });
    return recipes;
}

async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.api_token
        }
    });
}

async function extractPreviewRecipeDetails(recipes_info,user_id) {
    return await Promise.all(recipes_info.map((recipe_info) => {
        
        //check the data type so it can work with diffrent types of data
        let data = recipe_info;
        if (recipe_info.data) {
            data = recipe_info.data;
        }
        const {
            id,
            title,
            readyInMinutes,
            image,
            aggregateLikes,
            vegan,
            vegetarian,
            glutenFree,
        } = data;
        const isFavoritePromise = isfavorite(user_id, data.id);
        const isSeenPromise = is_seen(user_id, data.id);
        return Promise.all([isFavoritePromise, isSeenPromise]).then(
            ([isFavorite, isSeen]) => {
              return {
                id: id,
                title: title,
                image: image,
                readyInMinutes: readyInMinutes,
                popularity: aggregateLikes,
                vegan: vegan,
                vegetarian: vegetarian,
                glutenFree: glutenFree,
                Favorite: isFavorite,
                Seen: isSeen,
              };
            }
          );
    }))
  }
  async function getRecipesPreview(recipes_ids_list,user_id) {
    let promises = [];
    recipes_ids_list.map((id) => {
        promises.push(getRecipeInformation(id));
    });
    let info_res = await Promise.all(promises);
    info_res.map((recp)=>{console.log(recp.data)});
    // console.log(info_res);
    return extractPreviewRecipeDetails(info_res,user_id);
  }

async function getRecipeDetails(recipe_id,user_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let isFavorite= await isfavorite(user_id,recipe_id);
    let isSeen= await is_seen(user_id,recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;
    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
        Favorite: isFavorite,
        Seen: isSeen
        
    }
}



async function getRandomRecipesAPI(user_id){
    let random_pool = await getRandomRecipes();
    let filterd_random_pool = random_pool.data.recipes.filter((random)=>(random.instructions != "") && (random.image != "") && random.image)
    //  && random.title && random.readyInMinutes && random.aggregateLikes && random.vegan && random.vegetarian && random.glutenFree)
    if(filterd_random_pool.length < 3){
        return getRandomRecipesAPI(user_id);
    }
    return extractPreviewRecipeDetails([filterd_random_pool[0], filterd_random_pool[1], filterd_random_pool[2]], user_id);


}

async function getRecipeInfoFromApi(recipe_id) {
    let data = await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.api_token
        }
    });
    let ingredients = "";
    let instructions = "";
    data.data.extendedIngredients.forEach((element) => 
        ingredients = ingredients+element.name+"-"+element.amount.toString()+" " +element.unit+" | ")
    data.data.analyzedInstructions[0].steps.forEach((step) => 
        instructions = instructions+ step.number + ". " + step.step + "\n")
    return {
        id:data.data.id.toString(),
        title: data.data.title,
        image: data.data.image,
        readyInMinutes: data.data.readyInMinutes,
        aggregateLikes: data.data.aggregateLikes,
        prepInstructions:instructions,
        ingredients: ingredients,
        numberOfDishes: data.data.servings,
        vegetarian: data.data.vegetarian,
        vegan: data.data.vegan,
        glutenFree: data.data.glutenFree
    }; // extract the json fields we need

}

async function getRecipeInfoFromDb(recipe_id){
    const data = await DButils.execQuery(`SELECT * FROM userrecipes WHERE rid = ${recipe_id}`);
    return {
        id:data[0].rid.toString(),
        title: data[0].title,
        image: data[0].image,
        readyInMinutes: data[0].prep_time,
        aggregateLikes: data[0].popularity,
        prepInstructions: data[0].instructions,
        ingredients: data[0].ingredients,
        numberOfDishes: data[0].number_of_dishes,
        vegetarian:(data[0].vegetarian[0]==1),
        vegan: (data[0].vegan[0]==1),
        glutenFree: (data[0].gluten_free[0]==1)
    }; // get first element (only one) fields needed
}
async function getRecipeFullDetails(isMyrecipe,recipe_id, user_id, add_to_seen){
    let recipe_info = null
    let isFavorite= await isfavorite(user_id,recipe_id);
    let isSeen= await is_seen(user_id,recipe_id);
    
    if(isMyrecipe){
        recipe_info =await getRecipeInfoFromDb(recipe_id);
    }

    else if (!isMyrecipe){
        recipe_info = await getRecipeInfoFromApi(recipe_id);
   
    }
    else{ // neither inner or outer
        throw { status: 404, message: "no such recipe" };
    }
    let { id, title, image, readyInMinutes, aggregateLikes,vegetarian, vegan, 
        glutenFree,ingredients, prepInstructions, numberOfDishes } = recipe_info;
    
 
    
    //user watched the recipe
    if(user_id != undefined && add_to_seen) 
        await addUserRecipeToSeen(id, user_id) 

    return {
        recipePreview: {
            id: id,
            image: image,
            title: title,
            prepTime: readyInMinutes,
            popularity: aggregateLikes,
            vegetarian : vegetarian,
            vegan: vegan,
            glutenFree: glutenFree,
            Favorite:isFavorite,
            Seen: isSeen
          
              
        }, 
        ingredients: ingredients, 
        prepInstructions: prepInstructions, 
        numberOfDishes: numberOfDishes
    }

}

async function addUserRecipeToSeen(recipe_id, user_id){
    if(user_id != undefined && recipe_id != undefined){
        await DButils.execQuery
        (`INSERT INTO recipeseen  (user_id,recipe_id) VALUES('${user_id}','${recipe_id}')`)
    }    
}

async function getSearchResults(name, number, cuisine, diet, intolerance, sort, user_id) {
    // const recipes = await axios.get(`${api_domain}/complexSearch`, {
    //   params: {
    //     query: name,
    //     number: number,
    //     diet: diet,
    //     cuisine: cuisine,
    //     intolerances: intolerance,
    //     addRecipeInformation: true,
    //     instructionsRequired : true,
    //     sort: sort,
    //     apiKey: process.env.api_token,
    //   },
    // });
    let search_url= `${api_domain}/complexSearch/?`
    if(name !== undefined){
        search_url = search_url + `&query=${name}`
    }
    if(cuisine !== undefined){
        search_url = search_url + `&cuisine=${cuisine}`
    }
    if(diet !== undefined){
        search_url = search_url + `&diet=${diet}`
    }
    if(intolerance !== undefined){
        search_url = search_url + `&intolerance=${intolerance}`
    }
    //TODO: check if instructions not emty
    if(sort !== undefined){
        search_url = search_url + `&sort=${sort}`
    }
    search_url = search_url + `&instructionsRequired=true&addRecipeInformation=true` 
    console.log(search_url)
    if(number !== undefined){
        search_url = search_url + `&number=${number}`
    }
    
    const response = await axios.get(search_url,{
        params: {
            // number: 5,
            apiKey: process.env.api_token
        }
    });
  
    const res = await Promise.all(
        response.data.results.map(async (r) => {
        return {
          id: r.id,
          title: r.title,
          image: r.image,
          glutenFree: r.glutenFree,
          vegan: r.vegan,
          vegetarian: r.vegetarian,
          popularity: r.aggregateLikes,
          readyInMinutes: r.readyInMinutes,
          Favorite: await isfavorite(user_id, r.id),
          Seen : await is_seen(user_id, r.id),
        };
      })
    );
  
    return res;
  }
  

async function getFamilyRecipes(){
    const data = await DButils.execQuery(`SELECT image, title, prep_time, vegetarian, vegan, gluten_free, ingredients, instructions FROM userrecipes WHERE is_family = 1;`);

    return data;
}




exports.getRecipeDetails = getRecipeDetails;

exports.getRecipesPreview = getRecipesPreview;
exports.getRecipeFullDetails=getRecipeFullDetails;
exports.getRandomRecipesAPI=getRandomRecipesAPI;
exports.getSearchResults=getSearchResults;
exports.getFamilyRecipes=getFamilyRecipes;
