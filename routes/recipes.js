var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const DButils = require("./utils/DButils");

router.get("/", (req, res) => res.send("im here"));

/**
 * This path returns 3 random recipes
 */
router.get("/randomRecipes", async (req, res, next) => {
  try {
    const user_id = req.session.user_id; 
    let random_recipes = await recipes_utils.getRandomRecipesAPI(user_id);
    res.status(200).send(random_recipes)
    
  } catch (error) {
    next(error);
  }
});

/**
 * This path leads to the search page so users can search for specific recipes
 */
router.get("/search",async (req, res, next) => {
  try {
    
    const user_id = req.session.user_id; // can be null
    //last vied recipe
    const recipe = await recipes_utils.getSearchResults(req.query.recipename,req.query.number,req.query.cuisine,req.query.diet, req.query.intolerance,req.query.sort,user_id);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});
router.get('/familyRecipes', async (req,res,next)=>{
  try {
    // const user_id = req.session.user_id; 
    const recipe = await recipes_utils.getFamilyRecipes();
    res.send(recipe);
  } catch (error) {
    next(error);
  }
})
/**
 * This path returns a full details of a recipe by its id
 */
router.get("/:recipeId", async (req, res, next) => {
  try {
    const user_id = req.session.user_id; 
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId,user_id);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});



/**
 * This path returns a full details of a recipe by its id
 */
router.get("/ExtendedRecipes/:recipeId", async (req, res, next) => {
  try {
    const isMyRecipe = req.query.isMyRecipe === 'true';
    const user_id = req.session.user_id; // can be null
    const recipe = await recipes_utils.getRecipeFullDetails(isMyRecipe,req.params.recipeId, user_id, add_to_seen = true);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});


module.exports = router;
