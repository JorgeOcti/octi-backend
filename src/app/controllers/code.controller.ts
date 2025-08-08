import { Response } from 'express';
import type { IFileRequest } from '../../interfaces/global.interface';
import logger from '../../services/logger.service';
import CodeModel from '../models/code.model';
import CodeFile from '../models/codeFile.model';
import GeneralUtils from '../../utils/general.utils';
import History from '../models/history.model';
import { ModuleHistory, StatusHistory } from '../models/history.types';

class CodeController {

  readonly models: any;

  constructor() {
    this.models = {
      code: new CodeModel()
    };
    this.linkUnitToCode = this.linkUnitToCode.bind(this);
  }

  public async linkUnitToCode(req: IFileRequest, res: Response) {
    try{
        const { code } = req.params
        const {description, internalCode, type, fileCode, fileUnit} = req.body
        const codeFind = await CodeModel.findOne({code: code})
        if(!codeFind) return res.status(404).json({ok:false, message: "El código no existe"})

        codeFind.description = description
        if(internalCode) codeFind.internalCode = internalCode
        if(type) codeFind.type = type
        if(fileCode) codeFind.fileCode = fileCode
        if(fileUnit) codeFind.fileUnit = fileUnit

        const codeUpdated = await CodeModel.updateOne({_id: codeFind._id}, codeFind)
        const history = new History()
        history.status = StatusHistory.created
        history.module = ModuleHistory.import
        history.current = true
        history.code = codeFind._id
        history.executedAt = new Date()
        await History.create(history)
        return res.status(200).json({
            ok:true,
            message:"Código actualizado correctamente",
            codeUpdated
        })
    } catch (e) {
        logger.error(e);
        return res.status(500).json({
        message: 'Ha ocurrido un error',
        status: 500
        });
    }
  }
  public async uploadFile(req: IFileRequest, res: Response): Promise<any> {
      try {
        const file: any = GeneralUtils.getFileFromRequest(req.files, 'file');
        console.log(file)
        if (file) {
          try {
            const codeFile = new CodeFile();
            /*
              {
                fieldname: 'file',
                originalname: 'Captura de pantalla 2018-06-28 a la(s) 11.59.58.png',
                encoding: '7bit',
                mimetype: 'image/png',
                destination: '/tmp/',
                filename: 'Captura de pantalla 2018-06-28 a la(s) 11.59.58.png',
                path: '/tmp/Captura de pantalla 2018-06-28 a la(s) 11.59.58.png',
                size: 794429
              }
            */
            // fix exif
            // if (new RegExp('\\bimage\\b').test(file.mimetype)) {
            //   try {
            //     await this.autoRotate(file.path);
            //   } catch (e) {
            //     logger.error(
            //       `CodeController.uploadFile: Error making autoRotate ${e}`
            //     );
            // }
            // }
            file.headers = {
              'Content-Type': file.mimetype
            };

            codeFile.attach('file', file, async (error: any) => {
              if (error) {
                /* istanbul ignore next */
                return res.status(400).json(error);
              } else {
                await codeFile.save();
                return res.status(201).json({
                  data: {
                    _id: codeFile._id,
                    file: codeFile.file
                  },
                  status: 201
                });
              }
            });
          } catch (e) {
            // Raven.captureException(e, { req });
            /* istanbul ignore next */
            logger.error(`async error:`);
            /* istanbul ignore next */
            logger.error(e);
            /* istanbul ignore next */
            return res.status(400).json(e);
          }
        } else {
          logger.error(`uploadFile: La imagen es obligatoria.`);
          return res.status(400).json({
            message: 'La imagen es obligatoria.',
            status: 400
          });
        }
      } catch (e) {
        // Raven.captureException(e, { req, user: req.user });
        /* istanbul ignore next */
        logger.error(`changePreferred: Async Error.`);
        /* istanbul ignore next */
        /* istanbul ignore next */
        logger.error(e);
        return res.status(400).json({
          message: 'Ha ocurrido un error',
          status: 400
        });
      }
    }

    // private autoRotate(path: string): Promise<any> {
    //     // doc http://aheckmann.github.io/gm/docs.html
    //     /**** REQUIRE: imagemagick and graphicsmagick *****
    //      brew install imagemagick
    //      brew install graphicsmagick
    //      * */
    //     return new Promise((resolve, reject) => {
    //       try {
    //         GraphicsMagick(path)
    //           .autoOrient()
    //           .write(path, (err) => {
    //             if (err) {
    //               /* istanbul ignore next */
    //               resolve({});
    //             } else {
    //               resolve({});
    //             }
    //           });
    //       } catch {
    //         resolve({});
    //       }
    //     });
    // }
}

const codeController = new CodeController();
export default codeController;
