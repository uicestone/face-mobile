import gql from "graphql-tag";

export const resident = gql`
  query resident($where: ResidentWhereUniqueInput!) {
    resident(where: $where) {
      id
      name
      level
      unit {
        id
        building
        room
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
