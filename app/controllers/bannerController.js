const { bannerModel } = require("../models/bannerModel");

const bannerController = {
    mostrarFormulario: async (req, res) => {
        try {
            const banners = await bannerModel.findAll();
            res.render('pages/editarbanners', {
                banners: banners || []
            });
        } catch (error) {
            console.log('Erro ao carregar banners:', error);
            res.render('pages/editarbanners', {
                banners: []
            });
        }
    },

    atualizarBanners: async (req, res) => {
        try {
            console.log('Arquivos recebidos:', req.files);
            
            if (req.files) {
                // Processar banners desktop
                if (req.files.banner_desk_1 && req.files.banner_desk_1[0]) {
                    const filePath = 'imagem/banners/' + req.files.banner_desk_1[0].filename;
                    console.log('Atualizando banner desktop 1:', filePath);
                    await bannerModel.updateOrCreate(filePath, 'Home', 1, 1);
                }
                if (req.files.banner_desk_2 && req.files.banner_desk_2[0]) {
                    const filePath = 'imagem/banners/' + req.files.banner_desk_2[0].filename;
                    console.log('Atualizando banner desktop 2:', filePath);
                    await bannerModel.updateOrCreate(filePath, 'Home', 2, 1);
                }
                if (req.files.banner_desk_3 && req.files.banner_desk_3[0]) {
                    const filePath = 'imagem/banners/' + req.files.banner_desk_3[0].filename;
                    console.log('Atualizando banner desktop 3:', filePath);
                    await bannerModel.updateOrCreate(filePath, 'Home', 3, 1);
                }

                // Processar banners mobile
                if (req.files.banner_mobile_1 && req.files.banner_mobile_1[0]) {
                    const filePath = 'imagem/banners/' + req.files.banner_mobile_1[0].filename;
                    console.log('Atualizando banner mobile 1:', filePath);
                    await bannerModel.updateOrCreate(filePath, 'Home', 4, 1);
                }
                if (req.files.banner_mobile_2 && req.files.banner_mobile_2[0]) {
                    const filePath = 'imagem/banners/' + req.files.banner_mobile_2[0].filename;
                    console.log('Atualizando banner mobile 2:', filePath);
                    await bannerModel.updateOrCreate(filePath, 'Home', 5, 1);
                }
                if (req.files.banner_mobile_3 && req.files.banner_mobile_3[0]) {
                    const filePath = 'imagem/banners/' + req.files.banner_mobile_3[0].filename;
                    console.log('Atualizando banner mobile 3:', filePath);
                    await bannerModel.updateOrCreate(filePath, 'Home', 6, 1);
                }
            }

            console.log('Banners atualizados com sucesso');
            res.redirect('/homeadm?sucesso=banners_atualizados');
        } catch (error) {
            console.log('Erro ao atualizar banners:', error);
            res.redirect('/editarbanners?erro=falha_atualizacao');
        }
    }
};

module.exports = { bannerController };