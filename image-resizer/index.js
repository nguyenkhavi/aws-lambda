const sharp = require('sharp');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');

const EXPECTED_SIZES = [1024, 768, 300];
const EXPECTED_FORMATS = ['jpeg', 'webp'];
const ACCEPT_IMAGE_EXT = ['jpeg', 'webp', 'jpg', 'png', 'gif', 'avif', 'tiff', 'svg'];
const PREFIX = 'scaled';

const COMPOSED_SIZE_FORMAT = EXPECTED_SIZES.map((size) =>
  EXPECTED_FORMATS.map((format) => ({
    size,
    format,
    resizeStream: sharp().resize(size).toFormat(format),
  })),
).flat();

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
  region: process.env.REGION,
});

const isImage = (key) => {
  const ext = key.split('.')[1].toLowerCase();
  return ACCEPT_IMAGE_EXT.includes(ext);
};

const extractParams = (event) => {
  const fileName = decodeURIComponent(event.Records[0].s3.object.key).replace(/\+/g, ' ');
  const triggerBucketName = event.Records[0].s3.bucket.name;

  return { fileName, triggerBucketName };
};

const getFileFromS3 = async (triggerBucketName, fileName) => {
  const bucketParams = {
    Bucket: triggerBucketName,
    Key: fileName,
  };
  const data = await s3Client.send(new GetObjectCommand(bucketParams));
  const inputStream = data.Body;
  return inputStream;
};

const generateResizedStream = (inputStream) =>
  Promise.all(
    COMPOSED_SIZE_FORMAT.map(async ({ resizeStream, format, size }) => ({
      outputStream: await inputStream.pipe(resizeStream),
      format,
      size,
    })),
  );

const handler = async (event) => {
  const { fileName, triggerBucketName } = extractParams(event);
  if (!isImage(fileName)) {
    console.log(`File is not support, bucket: ${triggerBucketName}, fileName: ${fileName}`);
    return false;
  }

  // ? Download and write file to tmp dir
  const inputStream = await getFileFromS3(triggerBucketName, fileName);

  // ? Start resizing
  const resizedStreams = await generateResizedStream(inputStream);

  // ? Upload resized images to S3
  const uploadPromises = resizedStreams.map(({ outputStream, size, format }) => {
    const keyWithoutExt = fileName.split('.')[0];
    const resizedKey = `${PREFIX}/${keyWithoutExt}-w${size}.${format}`;
    const params = {
      ACL: 'public-read',
      Body: outputStream,
      Key: resizedKey,
      Bucket: triggerBucketName,
    };
    const parallelUploads3 = new Upload({
      client: s3Client,
      params,
    });

    return parallelUploads3.done();
  });
  await Promise.all(uploadPromises);
  return true;
};

exports.handler = (event) => {
  return handler(event);
};

// Test
const isLambda = !!process.env.LAMBDA_TASK_ROOT;
if (!isLambda) {
  handler({
    Records: [
      {
        eventVersion: '2.0',
        eventSource: 'aws:s3',
        awsRegion: 'eu-west-1',
        eventTime: '1970-01-01T00:00:00.000Z',
        eventName: 'ObjectCreated:Put',
        userIdentity: {
          principalId: 'EXAMPLE',
        },
        requestParameters: {
          sourceIPAddress: '127.0.0.1',
        },
        responseElements: {
          'x-amz-request-id': 'EXAMPLE123456789',
          'x-amz-id-2': 'EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH',
        },
        s3: {
          s3SchemaVersion: '1.0',
          configurationId: 'testConfigRule',
          bucket: {
            name: 'woobleu-dev',
            ownerIdentity: {
              principalId: 'EXAMPLE',
            },
            arn: 'arn:aws:s3:::woobleu-dev',
          },
          object: {
            key: 'test/nft.jpg',
            size: 1024,
            eTag: '0123456789abcdef0123456789abcdef',
            sequencer: '0A1B2C3D4E5F678901',
          },
        },
      },
    ],
  });
}
