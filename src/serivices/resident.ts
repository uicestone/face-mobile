import gql from "graphql-tag";

export const resident = gql`
  query resident($where: ResidentWhereUniqueInput!) {
    resident(where: $where) {
      id
      name
      unit {
        id
        building
        room
        level
      }
      passRecords(first: 10, orderBy: { date: desc }) {
        id
        direction
        allow
        date
      }
    }
  }
`;
