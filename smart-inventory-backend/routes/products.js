const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getProducts,
  getProduct,
  getByBarcode,
  getLowStock,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

router.use(protect); // all product routes require auth

router.get('/low-stock', getLowStock);
router.get('/barcode/:barcode', getByBarcode);
router.route('/').get(getProducts).post(createProduct);
router.route('/:id').get(getProduct).put(updateProduct).delete(deleteProduct);

module.exports = router;
