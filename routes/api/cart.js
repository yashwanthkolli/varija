const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");

const Cart = require("../../models/Cart");
const Product = require("../../models/Product");

// @route    GET api/cart
// @desc     Get user cart
// @access   Public
router.get("/", auth, async (req, res) => {
    const userId = req.user.id;
    try {
        const cart = await Cart.findOne({ userId });
        if (cart && cart.products.length > 0) {
            res.status(200).send(cart);
        } else {
            res.send(null);
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route    POST api/cart/add
// @desc     Add items to cart
// @access   Public
router.post("/add", auth, async (req, res) => {
    const userId = req.user.id;
    const { prodId, quantity } = req.body;
    try {
        const cart = await Cart.findOne({ userId });
        const product = await Product.findOne({ prodId });
        if (!product) {
            res.status(404).send({ message: "item not found" });
            return;
        }
        const wholesale = product.wholesale;
        const retail = product.retail;
        const name = product.name;
        //If cart already exists for user,
        if (cart) {
            const prodIndex = cart.products.findIndex((prod) => prod.prodId ==  prodId);
            //check if product exists or not
            if (prodIndex > -1) {
                let product = cart.products[prodIndex];
                product.quantity += quantity;
                cart.products[prodIndex] = product;
                const totalQuantity = cart.products.reduce((acc, cur) => {
                    return acc + cur.quantity
                }, 0)
                cart.bill = cart.products.reduce((acc, cur) => {
                    return totalQuantity < 10 ? acc + cur.quantity*cur.retail : acc + cur.quantity*cur.wholesale
                }, 0)
                await cart.save();
                res.status(200).send(cart);
            } else {
                cart.products.push({ prodId, quantity, wholesale, retail, name });
                const totalQuantity = cart.products.reduce((acc, cur) => {
                    return acc + cur.quantity
                }, 0)
                cart.bill = cart.products.reduce((acc, cur) => {
                    return totalQuantity < 10 ? acc + cur.quantity*cur.retail : acc + cur.quantity*cur.wholesale
                }, 0)
                await cart.save();
                res.status(200).send(cart);
            }
        } else {
            //no cart exists, create one
            const newCart = await Cart.create({
                userId,
                products: [{ prodId, quantity, wholesale, retail, name }],
                bill: quantity < 10 ? quantity*retail : quantity*wholesale,
            });
            return res.status(201).send(newCart);
        }
    } catch (error) {
       console.log(error);
       res.status(500).send("something went wrong");
    }
});

// @route    POST api/cart/delete
// @desc     Remove items from cart
// @access   Public
router.post("/delete", auth, async (req, res) => {
    const userId = req.user.id;
    const prodId = req.body.prodId;

    try {
        let cart = await Cart.findOne({ userId });
        const prodIndex = cart.products.findIndex((prod) => prod.prodId == prodId);
        
        if (prodIndex > -1) {
            cart.products.splice(prodIndex, 1);
            const totalQuantity = cart.products.reduce((acc, cur) => {
                return acc + cur.quantity
            }, 0)
            cart.bill = cart.products.reduce((acc, cur) => {
                return totalQuantity < 10 ? acc + cur.quantity*cur.retail : acc + cur.quantity*cur.wholesale
            }, 0)
            await cart.save();
            res.status(200).send(cart);
            } else {
                res.status(404).send("item not found");
            }
    } catch (error) {
        console.log(error);
        res.status(400).send();
    }
});

module.exports = router;