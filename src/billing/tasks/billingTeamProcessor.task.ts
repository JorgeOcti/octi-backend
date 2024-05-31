import * as mongoose from 'mongoose';
import * as moment from 'moment-timezone';

import Submodule from '../models/submodule.model';
import TeamBilling from '../models/teamBilling.model';
import InvoiceTeamBilling from '../models/invoiceTeamBilling.module';
import {
  IHistoryResults,
  IInvoiceData
} from 'billing/interfaces/teamBiling.interfaces';
import History from '../../app/models/history.model';
import { StatusHistory } from '../../app/models/history.types';
import Car from '../../app/models/car.model';
import User from "../../app/models/user.model";

class BillingTeamProcessor {
  readonly car: any;

  constructor () {
    this.processBilling = this.processBilling.bind(this);
    this.car = new Car({});
  }

  public async processBilling(filter: any = {}, run?: boolean): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        run =
          run ||
          moment()
            .startOf('day').date() == 27;
        // run = run || true;
        if (run) {
          mongoose.set('debug', false);
          console.log('START billing');
          // const valueUF = 28662.81; /*await this.getUFPrice();*/
          // const valueDolar = 767.98; /*await this.getDolarPrice();*/
          // const valueUF = await this.getUFPrice();
          // const valueDolar = await this.getDolarPrice();

          const teamBillings = await this.populatePath(filter);

          const subModules = await Submodule.find({});
          const infoByType: any = subModules.reduce((acc: any, cur: any) => {
            acc[cur.type] = {
              module: cur.module.toString(),
              subModule: cur._id.toString()
            };
            return acc;
          }, {});

          for (const teamBilling of teamBillings) {
            const now = moment().startOf('day');
            const lastInvoice = await InvoiceTeamBilling.findOne(
              {
                team: teamBilling.team._id
              },
              {
                to: 1
              }
            ).sort({
              createdAt: -1
            });

            const from = lastInvoice
              ? lastInvoice.to
              : new Date(
                  `${now.startOf('month').format('YYYY-MM-DD')}T00:00:00.000Z`
                );
            const to = moment().toDate();
            // let to = moment().endOf('month').subtract(3, 'days').startOf('day');
            // If the script runs earlier than automatically scheduled
            // if (now.isBefore(to)) {
            //   to = now;
            // }

            const histories = await this.findHistories(teamBilling, from, to)

            const {
              countByModule,
              countBySubmodule,
              countByCompany,
              uniqueHistories,
            } = await this.loopHistories(histories, infoByType);

            // console.log({
            //   countByModule,
            //   countByCompany,
            //   countBySubmodule
            // });

            const totalDolar = this.calculateDolar(teamBilling, countByModule);
            const period = now.format('YYYYMM');

            const dataInterface: IInvoiceData = {
              histories: histories,
              teamBilling: teamBilling,
              period: period,
              from: from,
              to: to,
              uniqueHistories: uniqueHistories,
              countByModule: countByModule,
              countBySubmodule: countBySubmodule,
              countByCompany: countByCompany,
              totalDolar: totalDolar
            };

            const invoiceData = await this.invoiceData(dataInterface);

            if (
              !(await InvoiceTeamBilling.find({
                team: teamBilling.team,
                period
              }).countDocuments())
            ) {
              const invoice = new InvoiceTeamBilling(invoiceData);
              await invoice.save();
              console.log(`Creating Invoice for ${period} ${teamBilling.team.name}.`);
            } else {
              console.log(`${period} ${teamBilling.team.name} ya existe!!!.`);
            }
          }
        }
        resolve({});

        /*const companies = await Company.find(filter);
        for (const company of companies) {
          console.log(`calculating billing ${company.name}`);
          const inventoryCars = await this.calculateCarsInInventory(company);
          const checklistCars = await this.calculateCarsInChecklist(company);
          const requestCars = await this.calculateCarsInRequest(company);
          const totalInventory = inventoryCars * company.billing.inventoryPrice;
          const totalChecklist = checklistCars * company.billing.checklistPrice;
          const totalRequest = requestCars * company.billing.requestPrice;
          const totalUF = totalInventory + totalChecklist + totalRequest;
          const period = moment().format('YYYYMM');
          const invoice = new Invoice({
            team: company.team,
            company,
            period,
            inventoryCars,
            checklistCars,
            requestCars,
            inventoryPrice: company.billing.inventoryPrice,
            checklistPrice: company.billing.checklistPrice,
            requestPrice: company.billing.requestPrice,
            totalUF,
            valueUF,
            // valueDolar,
            // totalDolar: (totalUF * valueUF) / valueDolar,
            totalPeso: totalUF * valueUF
          });
          if (!await Invoice.find({ company, period }).countDocuments()) {
            await invoice.save();
            this.createPDF(invoice, company);
          } else {
            console.log(`${period} ${company.name} ya existe!!!.`);
          }
        }*/
      } catch (e) {
        console.log(e);
        reject({});
      }
    });
  }

  private async populatePath(filter: any = {}): Promise<any> {
    return await TeamBilling.find(filter).populate([{ path: 'team' }]);
  }

  private async findHistories(teamBilling: any,
                              from: Date | undefined,
                              to: Date | undefined) {

    const EMAILS_CONSIDERAR = [
      "dercocenter.cl",
      "derco.cl",
      "imcruz.com",
      "dercomaq.cl",
      "inchape.cl",
      "autopia.cl",
      "inchcape.cl",
    ]
    const regex = EMAILS_CONSIDERAR.join("|");
    const users = await User.find({
      email: {
        "$regex": regex,
        "$options": "i"
      }
    });
    return await History.find(
      {
        company: { $in: teamBilling.companies },
        status: {
          $in: [
            StatusHistory.available,
            StatusHistory.inTransit,
            StatusHistory.sale
          ]
        },
        createdAt: {
          $gte: from,
          $lte: to
        },
        createdBy: {
          $in: users.map((user: any) => user._id)
        }
      },
      {
        company: 1,
        car: 1,
        module: 1
      }
    )
      .allowDiskUse(true)
      .populate([
        {
          path: 'car',
          select: ['vin']
        }
      ])
      .sort({
        createdAt: 1
      })
  }

  private async loopHistories(histories: any,
                              infoByType: any): Promise<IHistoryResults> {
    const usedVINS: any[] = [];
    const countByModule: any = {};
    const countBySubmodule: any = {};
    const countByCompany: any = {};
    const uniqueHistories: any[] = [];

    for (const history of histories) {
      if (
        history.module in infoByType &&
        history?.car?.vin?.trim()?.length &&
        !usedVINS.includes(history.car.vin)
      ) {
        uniqueHistories.push(history._id);
        usedVINS.push(history.car.vin);
        const info = infoByType[history.module];

        if (info.module in countByModule) {
          countByModule[`${info.module}`] = {
            _id: info.module,
            count: countByModule[`${info.module}`].count + 1,
            histories: [
              ...countByModule[`${info.module}`].histories,
              history._id
            ]
          };
        } else {
          countByModule[`${info.module}`] = {
            _id: info.module,
            count: 1,
            histories: [history._id]
          };
        }

        if (info.subModule in countBySubmodule) {
          countBySubmodule[`${info.subModule}`] = {
            _id: info.subModule,
            count: countBySubmodule[`${info.subModule}`].count + 1,
            histories: [
              ...countBySubmodule[`${info.subModule}`].histories,
              history._id
            ]
          };
        } else {
          countBySubmodule[`${info.subModule}`] = {
            _id: info.subModule,
            count: 1,
            histories: [history._id]
          };
        }

        if (history.company in countByCompany) {
          countByCompany[`${history.company}`] = {
            _id: history.company,
            count: countByCompany[`${history.company}`].count + 1,
            histories: [
              ...countByCompany[`${history.company}`].histories,
              history._id
            ]
          };
        } else {
          countByCompany[`${history.company}`] = {
            _id: history.company,
            count: 1,
            histories: [history._id]
          };
        }
      }
    }

    const result: IHistoryResults = {
      countByModule: countByModule,
      countBySubmodule: countBySubmodule,
      countByCompany: countByCompany,
      uniqueHistories: uniqueHistories
    };

    return result;
  }

  private calculateDolar(teamBilling: any, countByModule: any): number {
    let sumUFbyModule: any = {};
    let totalDolar: number = 0;
    let totalUnits: number = 0;

    teamBilling.modules.forEach((module: any) => {
      if (module.module in countByModule) {
        totalUnits += countByModule[`${module.module}`].count

        const section  = module.sections.find((section: any) => {
          return section.start <= totalUnits && totalUnits <= section.end
        })

        sumUFbyModule[`${module.module}`] = {
          count: countByModule[`${module.module}`].count,
          total: section.price * countByModule[`${module.module}`].count
        };

        totalDolar += section.price * countByModule[`${module.module}`].count

        // module.sections.sort((a: any, b: any) => {
        //     if (a.start < b.start) {
        //       return -1;
        //     }
        //     if (a.start > b.start) {
        //       return 1;
        //     }
        //     return 0;
        //   })
        //   .forEach((section: any) => {
        //     new Array(countByModule[`${module.module}`].count)
        //       .fill(0)
        //       .forEach((_, index: number) => {
        //         const item = index + 1;
        //         if (item >= section.start && item <= section.end) {
        //           totalDolar += section.price;
        //           if (module.module in sumUFbyModule) {
        //             const count =
        //               sumUFbyModule[`${module.module}`].count + 1;
        //             const total =
        //               sumUFbyModule[`${module.module}`].total +
        //               section.price;
        //             sumUFbyModule[`${module.module}`] = {
        //               count,
        //               total
        //             };
        //           } else {
        //             sumUFbyModule[`${module.module}`] = {
        //               count: 1,
        //               total: section.price
        //             };
        //           }
        //         }
        //       });
        //   });
      }
    });

    return totalDolar;
  }

  private async invoiceData(dataInterface: IInvoiceData): Promise<any> {

    const {
      histories,
      teamBilling,
      period,
      from,
      to,
      uniqueHistories,
      countByModule,
      countBySubmodule,
      countByCompany,
      totalDolar
    } = dataInterface;

    return {
      team: teamBilling.team,
      period,
      teamBilling,
      histories: histories.map((history: any) => history._id),
      uniqueHistories,
      modules: Object.values(countByModule).map((module: any) => ({
        module: module._id,
        histories: module.histories
      })),
      subModules: Object.values(countBySubmodule).map(
        (subModule: any) => ({
          subModule: subModule._id,
          histories: subModule.histories
        })
      ),
      companies: Object.values(countByCompany).map((company: any) => ({
        company: company._id,
        histories: company.histories
      })),
      // valueUF,
      // valueDolar,
      // totalUF,
      from,
      to,
      total: uniqueHistories.length,
      realDolar: totalDolar,
      totalDolar:
        totalDolar > teamBilling.baseCost
          ? totalDolar
          : teamBilling.baseCost
      // total
    };
  }

}

export default BillingTeamProcessor;
