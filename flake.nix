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
            pkgs.python313Packages.openai
            pkgs.python313Packages.sqlalchemy
            pkgs.python313Packages.pgvector
            pkgs.python313Packages.psycopg2-binary
        ];
      };
    });
}
