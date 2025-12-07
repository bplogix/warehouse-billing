import decimal
from enum import Enum

from sqlalchemy import DECIMAL, VARCHAR, Index, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class CompanyType(str, Enum):
    SUPER = "0"
    WAREHOUSE = "1"
    AGENT = "2"
    SELLER = "3"


class RbCompanyInfo(Base):
    __tablename__ = "rb_company_info"
    __table_args__ = (Index("company_id_index", "COMPANY_ID"), {"comment": "公司表"})

    COMPANY_ID: Mapped[str] = mapped_column(VARCHAR(50), primary_key=True, comment="公司编号")
    COMPANY_NAME: Mapped[str] = mapped_column(VARCHAR(100), nullable=False, comment="公司名称")
    COMPANY_TYPE: Mapped[CompanyType] = mapped_column(
        VARCHAR(2),
        nullable=False,
        comment="0-SUPER公司，1-仓库公司，2-代理公司，3-卖家公司",
    )
    CREATE_AUTHOR: Mapped[str] = mapped_column(VARCHAR(20), nullable=False)
    P_COMPANY_ID: Mapped[str | None] = mapped_column(VARCHAR(20), comment="父公司编号")
    COMPANY_NAME_EN: Mapped[str | None] = mapped_column(VARCHAR(100), comment="公司英文名称")
    COMPANY_CORPORATION: Mapped[str | None] = mapped_column(VARCHAR(50), comment="公司法人")
    COMPANY_PHONE: Mapped[str | None] = mapped_column(VARCHAR(100), comment="公司电话")
    COMPANY_FAX: Mapped[str | None] = mapped_column(VARCHAR(13), comment="公司传真")
    COMPANY_EMAIL: Mapped[str | None] = mapped_column(VARCHAR(30), comment="公司邮件")
    COMPANY_ADDRESS: Mapped[str | None] = mapped_column(VARCHAR(200), comment="公司地址")
    LANGUAGE: Mapped[str | None] = mapped_column(VARCHAR(50), comment="支持语言")
    IS_DELETE: Mapped[str | None] = mapped_column(VARCHAR(2), server_default=text("'0'"), comment="是否显示")
    REMARKS: Mapped[str | None] = mapped_column(VARCHAR(100), comment="备注")
    ZIP_CODE: Mapped[str | None] = mapped_column(VARCHAR(50), comment="邮编")
    DATA_JSON: Mapped[str | None] = mapped_column(VARCHAR(1000))
    CREATE_TIME: Mapped[str | None] = mapped_column(VARCHAR(23), comment="创建时间")
    DEFAULT_MATERIALS: Mapped[str | None] = mapped_column(VARCHAR(1000), comment="材质")
    DEFAULT_TECHNOLOGYS: Mapped[str | None] = mapped_column(VARCHAR(1000), comment="工艺")
    BALANCE: Mapped[decimal.Decimal | None] = mapped_column(DECIMAL(10, 2), comment="余额")
    LINE_OF_CREDIT: Mapped[decimal.Decimal | None] = mapped_column(DECIMAL(10, 2), comment="透支额度")
    FEE_DEDUCTION_SWITCH: Mapped[str | None] = mapped_column(
        VARCHAR(2), server_default=text("'0'"), comment="扣费开关，0不扣费，1扣费"
    )
    CURRENCY: Mapped[str | None] = mapped_column(VARCHAR(10), server_default=text("'CNY'"), comment="币制")
    COMPANY_CLASSIFICATION: Mapped[str | None] = mapped_column(VARCHAR(2), comment="公司分类")
    COMPANY_CODE: Mapped[str | None] = mapped_column(VARCHAR(20), comment="公司编码")
    SALES_PERSON: Mapped[str | None] = mapped_column(VARCHAR(50), comment="销售人")
    CONTRACT: Mapped[str | None] = mapped_column(VARCHAR(50), comment="联系人信息")
    CORPORATION_NO: Mapped[str | None] = mapped_column(VARCHAR(50), comment="法人番号")
    PAYMENT_DATE: Mapped[str | None] = mapped_column(VARCHAR(50), comment="账期")
    CUSTOMER_GRADE: Mapped[str | None] = mapped_column(VARCHAR(20), comment="客户等级")
    AMOUNT_TOBE_SOLD: Mapped[str | None] = mapped_column(VARCHAR(2000), comment="未销金额")
    ORDER_CATEGORY: Mapped[str | None] = mapped_column(
        VARCHAR(12), server_default=text("''"), comment="订单类别（NR:普通 DS:代发）"
    )
    RATE_INFO: Mapped[str | None] = mapped_column(VARCHAR(255), comment="结算汇率信息")
    CNY_RATE: Mapped[decimal.Decimal | None] = mapped_column(DECIMAL(12, 5), comment="人民币汇率")
    JPY_RATE: Mapped[decimal.Decimal | None] = mapped_column(DECIMAL(12, 5), comment="日元汇率")
    KRW_RATE: Mapped[decimal.Decimal | None] = mapped_column(DECIMAL(12, 5), comment="韩元汇率")
    USD_RATE: Mapped[decimal.Decimal | None] = mapped_column(DECIMAL(12, 5), comment="美元汇率")
    EUR_RATE: Mapped[decimal.Decimal | None] = mapped_column(DECIMAL(12, 5), comment="欧元汇率")
    COMPANY_ADDRESS_EN: Mapped[str | None] = mapped_column(VARCHAR(200), comment="公司地址英文")
    COMPANY_ACCOUNT: Mapped[str | None] = mapped_column(VARCHAR(50), comment="公司账号")
    POUNDAGE_RATIO: Mapped[decimal.Decimal | None] = mapped_column(DECIMAL(12, 5), comment="到付手续费比例")
