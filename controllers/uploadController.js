import { cloudinary } from '../config/cloudinary.js';

// @desc    Subir imagen a Cloudinary
// @route   POST /api/upload
// @access  Privado/Admin
export const subirImagen = async (req, res) => {
  try {
    console.log('📸 Petición recibida');
    console.log('📸 Archivo:', req.file ? 'SÍ' : 'NO');
    
    if (!req.file) {
      console.log('❌ No hay archivo');
      return res.status(400).json({ mensaje: 'No se ha enviado ninguna imagen' });
    }

    console.log('📸 Detalles archivo:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer ? 'SÍ tiene buffer' : 'NO tiene buffer'
    });

    console.log('📸 Iniciando subida a Cloudinary...');

    // Convertir buffer a base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Subir a Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'catalogo-antonella',
      transformation: [{ width: 800, height: 800, crop: 'limit' }],
      resource_type: 'auto'
    });

    console.log('✅ Imagen subida exitosamente:', result.secure_url);

    res.json({
      mensaje: 'Imagen subida exitosamente',
      url: result.secure_url,
      cloudinary_id: result.public_id
    });

  } catch (error) {
    console.error('❌ Error completo:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({ 
      mensaje: 'Error al procesar imagen', 
      error: error.message,
      detalles: error.toString()
    });
  }
};