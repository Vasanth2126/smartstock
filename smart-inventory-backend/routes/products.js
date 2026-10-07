const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  getByBarcode,
  getLowStock,
  createProduct,
  updateProduct,
  adjustStock,
  deleteProduct,
  bulkImportProducts,
} = require('../controllers/productController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getProducts)
  .post(restrictTo('owner', 'superadmin'), createProduct);

router.get('/low-stock', getLowStock);
router.get('/barcode/:barcode', getByBarcode);

router.post('/bulk-import', restrictTo('owner', 'superadmin'), bulkImportProducts);
router.post('/:id/adjust-stock', restrictTo('owner', 'superadmin'), adjustStock);

router.route('/:id')
  .get(getProduct)
  .put(restrictTo('owner', 'superadmin'), updateProduct)
  .delete(restrictTo('owner', 'superadmin'), deleteProduct);

module.exports = router;
