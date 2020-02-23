import gql from "graphql-tag";

export const createOnePassRecord = gql`
  mutation createOnePassRecord($data: PassRecordCreateInput!) {
    createOnePassRecord(data: $data) {
      id
    }
  }
`;
