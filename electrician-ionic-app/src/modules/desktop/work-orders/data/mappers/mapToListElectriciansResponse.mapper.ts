import {
  IElectrician,
  IElectriciansResponse,
} from '../interfaces/assingElectricians';

export class ListElectriciansMapper {
  static toArrayMapper = (
    electricianListResponse: IElectriciansResponse[]
  ): IElectrician[] =>
    electricianListResponse.map((electrician) => {
      return {
        id: electrician.electrician_id,
        name: electrician.name,
        roles: electrician.roles,
        is_assigned: electrician.is_assigned,
      };
    });
}
