{
  description = "A Nix-flake-based Node 24 development environment";
  inputs = {
    nixpkgs.url = "https://flakehub.com/f/NixOS/nixpkgs/0.1.*.tar.gz";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
    let
      pkgs = import nixpkgs { inherit system; };
    in
    {
      devShells.default = pkgs.mkShell {
        packages = [
            pkgs.nodejs_24
            pkgs.python313Packages.sqlalchemy
            pkgs.python313Packages.psycopg2-binary
            pkgs.python313Packages.fastapi
            pkgs.python313Packages.uvicorn
            pkgs.python313Packages.python-multipart
            pkgs.python313Packages.pydantic
            pkgs.python313Packages.python-jose
            pkgs.python313Packages.passlib
            pkgs.python313Packages.email-validator
            pkgs.python313Packages.langchain
            pkgs.python313Packages.langchain-community
            pkgs.python313Packages.langchain-openai
            pkgs.python313Packages.langchain-huggingface
            pkgs.python313Packages.openai
            pkgs.python313Packages.requests
            pkgs.python313Packages.pymupdf
            pkgs.python313Packages.pypdf
            pkgs.python313Packages.pgvector
            pkgs.python313Packages.google-generativeai
            pkgs.python313Packages.bcrypt
        ];
      };
    });
}
