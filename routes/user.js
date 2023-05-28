var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");
/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users").then((users) => {
      if (users.find((x) => x.user_id === req.session.user_id)) {
        req.user_id = req.session.user_id;
        next();
      }
    }).catch(err => next(err));
  } else {
    res.sendStatus(401);
  }
});


/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    await user_utils.markAsFavorite(user_id,recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
    } 
  catch(error){
    next(error);
  }
})

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    let favorite_recipes = {};
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
    const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});

router.get('/lastViewedRecipes', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    let watched_recipes = {};
    const recipes_id = await user_utils.getSeenRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
    const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});

router.post('/MyRecipes', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const image = req.body.recipePreview.image;
    const title = req.body.recipePreview.title;
    const readyInMinutes = req.body.recipePreview.readyInMinutes;
    // const popularity = req.body.recipePreview.popularity;
    const glutenFree = req.body.recipePreview.glutenFree;
    const vegan= req.body.recipePreview.vegan;
    const vegetarian= req.body.recipePreview.vegetarian;
    const ingredients = req.body.ingredient;
    const prepInstructions = req.body.prepInstructions;
    const numberOfDishes = req.body.numberOfDishes;
    await user_utils.CreateRecipe(user_id,image,title,readyInMinutes,glutenFree,vegan,vegetarian,ingredients,prepInstructions,numberOfDishes);
    res.status(200).send("The Recipe successfully created");
    } 
  catch(error){
    next(error);
  }
})

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get('/MyRecipes', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipes_info = await user_utils.getMyRecipes(user_id);
    // const recipes_id = await user_utils.getMyRecipes(user_id);
    // let recipes_id_array = [];
    // recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
    // const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    res.status(200).send(recipes_info);
  } catch(error){
    next(error); 
  }
});


module.exports = router;
