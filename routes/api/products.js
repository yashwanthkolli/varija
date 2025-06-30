const express = require("express");
const router = express.Router();
const authenticateAdmin = require("../../middleware/authenticateAdmin");

const Product = require("../../models/Product")

// @route    GET api/prod
// @desc     Get All Products
// @access   Public
router.get("/", async (req, res) => {
  try {
        const products = await Product.find({disabled: false});
        res.json(products)
  } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
  }
});

router.get("/admin/", async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products)
    } catch (err) {
            console.error(err.message);
            res.status(500).send("Server Error");
    }
})

// @route    POST api/prod/:id
// @desc     Create new product
// @access   Public
router.get("/:id", async (req, res) => {
    try {
        const prodId = req.params.id 
        const prod = await Product.findOne({prodId, disabled: false})
        res.json(prod)
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

router.get("/admin/:id", async (req, res) => {
    try {
        const prodId = req.params.id 
        const prod = await Product.findOne({prodId})
        res.json(prod)
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route    POST api/prod
// @desc     Create new product
// @access   Public
router.post("/", authenticateAdmin, async (req,  res) => {
    try {
        const newProd = new Product({...req.body})
        await newProd.save()
        res.status(200).send(newProd)
    } catch (err) {
        console.log(err.message)
        res.status(500).send("Server Error");
    }
});

router.put('/:id', authenticateAdmin, async(req, res) => {
    const prodId = req.params.id;
    const updates = req.body;

    try {
        const product = await Product.findByIdAndUpdate(prodId, updates, {
        new: true, // return updated doc
        runValidators: true,
        });

        if (!product) return res.status(404).json({ message: "Product not found" });

        res.json({ message: "Product updated successfully", product });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Failed to update product", error });
    }
})

module.exports = router;