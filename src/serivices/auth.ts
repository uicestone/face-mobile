import gql from "graphql-tag";
const userFragment = `
id
name
community{
  id
  address
  name
}
`;

export const login = gql`
  mutation login($login: String!, $password: String!) {
    login(password: $password, login: $login) {
      token
      user {
        ${userFragment}
      }
    }
  }
`;

export const me = gql`
  query{
    me{
      ${userFragment}
    }
  }
`;
