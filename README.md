# Statek

An Atek application for hosting static websites from folders, git repos, or hyperdrives

## How to use

After installing the service, configure `SOURCE_URL` to be the address of the folder you want to host. It may be:

- **Local folder**. Pass in the path or `file://` URL.
- **Git repo**. Pass in the `https://` URL of the repo.
- **Hyperdrive**. Pass in the `hyper://` URL of the drive.

If setting up using atek's CLI, you install Statek like this:

```
atek install https://github.com/atek-cloud/statek --config.SOURCE_URL {your_url}
```

If you want to change the source URL, you do this:

```
atek cfg statek --config.SOURCE_URL {new_url}
atek restart statek
```

## License

MIT