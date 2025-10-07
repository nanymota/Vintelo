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
            if (req.files) {
                // Processar banners desktop
                if (req.files.banner_desk_1) {
                    await bannerModel.updateOrCreate('imagem/banners/' + req.files.banner_desk_1[0].filename, 'Home', 1, 1);
                }
                if (req.files.banner_desk_2) {
                    await bannerModel.updateOrCreate('imagem/banners/' + req.files.banner_desk_2[0].filename, 'Home', 2, 1);
                }
                if (req.files.banner_desk_3) {
                    await bannerModel.updateOrCreate('imagem/banners/' + req.files.banner_desk_3[0].filename, 'Home', 3, 1);
                }

                // Processar banners mobile
                if (req.files.banner_mobile_1) {
                    await bannerModel.updateOrCreate('imagem/banners/' + req.files.banner_mobile_1[0].filename, 'Home', 4, 1);
                }
                if (req.files.banner_mobile_2) {
                    await bannerModel.updateOrCreate('imagem/banners/' + req.files.banner_mobile_2[0].filename, 'Home', 5, 1);
                }
                if (req.files.banner_mobile_3) {
                    await bannerModel.updateOrCreate('imagem/banners/' + req.files.banner_mobile_3[0].filename, 'Home', 6, 1);
                }
            }

            res.redirect('/homeadm?sucesso=banners_atualizados');
        } catch (error) {
            console.log('Erro ao atualizar banners:', error);
            res.redirect('/editarbanners?erro=falha_atualizacao');
        }
    }
};

module.exports = { bannerController };