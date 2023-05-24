var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

router.get("/", (req, res) => res.send("im here"));


/**
 * This path returns a full details of a recipe by its id
 */
router.get("/:recipeId", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});

router.get("/:randomRecipes", async (req, res, next) => {
    try {
    // const user_id = req.session.user_id;
    const randomRecipes = await recipes_utils.getRandomRecipesAPI();
    for (const r of randomRecipes){
      const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
      res.send(recipe);
    }
  } catch (error) {
    next(error);
  }
});
module.exports = router;
