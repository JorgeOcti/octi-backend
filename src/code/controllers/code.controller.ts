import { Response } from 'express';
import * as path from 'path';
import * as QRCode from 'qrcode';
import puppeteer from 'puppeteer';
import logger from '../../services/logger.service';
import type { IRequest } from '../../interfaces/global.interface';
import GeneralUtils from '../../utils/general.utils';

class CodeController {
    constructor() {
        this.pdfCode = this.pdfCode.bind(this);
    }
    
    public async pdfCode(req: IRequest, res: Response): Promise<any> {
        
        const { debug } = req.query as {
            debug: string;
        };
        const { codes } = req.body;
        
        try {
            logger.info(
                `CodeController.pdfCode #${codes.length} codes requested`
            );
            
            if (codes) {
                const context =  {
                    codes: await Promise.all(codes.map(async (code: string) => ({
                        code: code,
                        qr: await QRCode.toDataURL("https://code.osacontrol.cl/" + code + "/", {
                            errorCorrectionLevel: 'H',
                            margin: 0,
                            rendererOpts: {
                                quality: 1
                            }
                        })
                    })))
                }

                const template = path.join(__dirname, '../../../views/code/qr_code.pug');

                const html = GeneralUtils.generateHtmlFromPugFile(template, context);
                
                
                if (debug) {
                    return res.send(html);
                } else {
                    const browser = await puppeteer.launch({
                        executablePath: '/usr/bin/chromium',
                        args: [
                            '--no-sandbox'
                        ],
                        headless: true
                    });
                    
                    const page = await browser.newPage();
                    
                    await page.setContent(html, {
                        waitUntil: 'networkidle0'
                    });
                    
                    const pdfBuffer = await page.pdf({
                        format: 'letter',
                        margin: {
                            top: '0mm',
                            right: '0mm',
                            bottom: '0mm',
                            left: '0mm',
                        },
                        printBackground: true,
                    });
                    
                    await browser.close();
                    
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader(
                        'Content-disposition',
                        `inline; filename=OsaCodes.pdf`
                    );
                    return res.send(pdfBuffer);
                }
            } else {
                return res.status(404).json({
                    message: 'Error generando el PDF',
                    status: 404
                });
            }
            
        } catch (e) {
            logger.error(e);
            return res.status(500).json({
                message: 'Ha ocurrido un error generando el PDF',
                status: 500
            });
        }
    }
}

export default new CodeController();