declare namespace API_AUTH {
  type LoginParams = {
    username: string;
    password: string;
  };

  type LoginResult = {
    success?: boolean;
    data: {
      token: string;
      user: string;
    };
  };
}
