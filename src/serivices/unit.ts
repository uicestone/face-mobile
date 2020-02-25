import gql from "graphql-tag";

export const units = gql`
  query units($where: UnitWhereInput, $orderBy: UnitOrderByInput, $skip: Int, $after: UnitWhereUniqueInput, $before: UnitWhereUniqueInput, $first: Int, $last: Int) {
    units(where: $where, orderBy: $orderBy, skip: $skip, after: $after, before: $before, first: $first, last: $last) {
      id
      building
      room
      level
      residents {
        id
      }
    }
  }
`;
